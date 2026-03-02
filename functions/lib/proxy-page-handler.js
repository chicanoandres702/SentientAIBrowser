"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activePages = exports.activeContexts = void 0;
exports.getPersistentPage = getPersistentPage;
exports.closePage = closePage;
exports.captureAndSyncTab = captureAndSyncTab;
exports.saveSessionForTab = saveSessionForTab;
exports.closeAllPagesForUser = closeAllPagesForUser;
// Feature: Page Lifecycle | Trace: README.md
const proxy_config_1 = require("./proxy-config");
const proxy_nav_controller_1 = require("./proxy-nav-controller");
const proxy_session_service_1 = require("./proxy-session.service");
const proxy_cdp_service_1 = require("./proxy-cdp.service");
const proxy_url_watcher_1 = require("./proxy-url-watcher");
const proxy_tab_sync_broker_1 = require("./proxy-tab-sync.broker");
// Why: block heavy binary resources that waste bandwidth and slow down Playwright.
// Images/fonts/media are irrelevant for the LLM's ARIA snapshot + screenshot flow.
const BLOCKED_EXTENSIONS = [
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico',
    '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.webm',
];
exports.activeContexts = new Map();
exports.activePages = new Map();
// Why: track userId per tab so closePage and captureAndSyncTab can save/restore the right session
const activeUserIds = new Map();
// Why: store interval IDs so closePage can clear them — prevents ghost re-creation of closed tabs
const syncIntervals = new Map();
// Why: tombstone set — once a tab is closed, captureAndSync will never re-write its Firestore doc.
// Fixes the race where an in-flight captureAndSync finishes after closePage clears the interval.
const closedTabs = new Set();
// Why: redirect-settling guard — natural redirects (JS, meta-refresh, link clicks) fire multiple
// framenavigated events in a chain. If captureAndSync fires mid-chain it snapshots an intermediate
// URL and writes it to Firestore, which the frontend reads as the "current" URL and re-navigates
// to — restarting the redirect loop. We debounce: block captureAndSync for 1.5s after the last
// framenavigated event so only the final settled URL reaches Firestore.
const redirectingTabs = new Set();
const redirectDebounceTimers = new Map();
let firestoreAvailable = true;
// Why: detect pages that require human interaction (2FA, CAPTCHA, auth challenges).
// When on these pages we extend the redirect-debounce to 60 s so captureAndSync
// doesn't fire mid-verification and the LLM agent knows to sit still.
const TFA_URL_PATTERNS = [
    '/mfa', '/2fa', '/two-factor', '/otp', '/verify',
    '/challenge', '/checkpoint', 'totp', 'step-up',
    '/signin/v2/challenge', 'accounts.google.com/signin',
    'login.microsoftonline.com', 'appleid.apple.com',
];
const is2FAPage = (url) => {
    const lower = url.toLowerCase();
    return TFA_URL_PATTERNS.some(p => lower.includes(p));
};
// Why: Stealth headers — make Playwright look like a real Chrome user.
// Without these, Google/Cloudflare instantly detect navigator.webdriver and show CAPTCHAs.
const STEALTH_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const STEALTH_INIT_SCRIPT = `
  Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
  Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
  Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
  Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
  // Why: fake realistic plugin list so fingerprinting scripts don't see an empty navigator.plugins
  Object.defineProperty(navigator, 'plugins', { get: () => {
    const mkPlugin = (name, desc, filename) => { const p = Object.create(Plugin.prototype); Object.assign(p, { name, description: desc, filename }); return p; };
    return [mkPlugin('PDF Viewer','Portable Document Format','internal-pdf-viewer'), mkPlugin('Chrome PDF Viewer','Portable Document Format','mhjfbmdgcfjbbpaeojofohoefgiehjai'), mkPlugin('Chromium PDF Viewer','Portable Document Format','internal-pdf-viewer')];
  }});
  // Why: chrome runtime presence is checked by most bot detectors
  window.chrome = { runtime: {}, loadTimes: () => ({}), csi: () => ({}), app: { isInstalled: false, InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' }, RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' } } };
  // Why: permissions.query for 'notifications' is a common fingerprint probe
  if (window.navigator.permissions) {
    const origQuery = window.navigator.permissions.query.bind(window.navigator.permissions);
    window.navigator.permissions.query = (params) =>
      params.name === 'notifications'
        ? Promise.resolve({ state: 'default', onchange: null })
        : origQuery(params);
  }
  // Why: connection object is used by bot detectors to verify realistic network conditions
  if (!navigator.connection) {
    Object.defineProperty(navigator, 'connection', { get: () => ({ rtt: 50, downlink: 10, effectiveType: '4g', saveData: false }) });
  }
`;
async function setupRequestBlocking(page) {
    await page.route('**/*', (route) => {
        const url = route.request().url();
        if (BLOCKED_EXTENSIONS.some(ext => url.endsWith(ext)))
            route.abort();
        else
            route.continue();
    });
}
async function captureAndSync(tabId, userId, page, context) {
    // Why: tombstone check — prevents an in-flight tick from re-creating a closed tab's Firestore doc
    if (closedTabs.has(tabId)) {
        console.debug(`[CaptureSync] ⛔ skip tombstoned tab ${tabId}`);
        return;
    }
    if (!firestoreAvailable) {
        console.debug(`[CaptureSync] ⛔ skip – Firestore unavailable`);
        return;
    }
    // Why: skip mid-redirect — framenavigated debounce hasn't cleared yet, meaning a redirect chain
    // is still in progress. Syncing now would snapshot an intermediate URL and create a loop where
    // Firestore holds the wrong URL and the frontend/AI re-navigates back to it.
    if (redirectingTabs.has(tabId)) {
        console.debug(`[CaptureSync] ⏳ skip – tab ${tabId} still redirecting`);
        return;
    }
    // Why: never broadcast about:blank — prevents overwriting a real URL with a transitional blank state
    const currentUrl = page.url();
    if (!currentUrl || currentUrl === 'about:blank' || currentUrl === 'about:newtab') {
        console.debug(`[CaptureSync] ⛔ skip blank/newtab for ${tabId}`);
        return;
    }
    console.debug(`[CaptureSync] 📸 capturing tab=${tabId} url=${currentUrl}`);
    try {
        const screenshot = (await page.screenshot({ quality: 60, type: 'jpeg' })).toString('base64');
        const title = (await page.title()) || 'Loading...';
        // Why: WebSocket broadcast reaches the client in <10ms — server is the URL authority.
        // The client updates the address bar from this event WITHOUT writing back to Firestore,
        // which eliminates the redirect-echo loop that previously caused AI re-navigation loops.
        (0, proxy_tab_sync_broker_1.broadcastTabSync)(tabId, { type: 'url', tabId, url: currentUrl, title });
        (0, proxy_tab_sync_broker_1.broadcastTabSync)(tabId, { type: 'screenshot', tabId, data: `data:image/jpeg;base64,${screenshot}`, url: currentUrl });
        await proxy_config_1.db.collection('browser_tabs').doc(tabId).set(Object.assign(Object.assign({ id: tabId, screenshot: `data:image/jpeg;base64,${screenshot}`, url: currentUrl, title, source: 'proxy' }, (userId && userId !== 'default' ? { user_id: userId } : {})), { last_sync: new Date().toISOString() }), { merge: true });
        console.debug(`[CaptureSync] ✅ wrote tab=${tabId} url=${currentUrl} user=${userId}`);
    }
    catch (e) {
        if (e.message.includes('credentials') || e.message.includes('Could not load the default')) {
            firestoreAvailable = false;
            console.warn(`[CaptureSync] ⚠️ Firestore sync disabled (no credentials). Screenshots available via /screenshot route.`);
        }
        else if (!e.message.includes('Target closed') && !e.message.includes('Execution context was destroyed')) {
            console.error(`[CaptureSync] ❌ Sync failed tab=${tabId}:`, e.message);
        }
    }
}
async function getPersistentPage(targetUrl, tabId, userId = 'default') {
    var _a;
    const browser = await (0, proxy_config_1.getBrowser)();
    let page = exports.activePages.get(tabId);
    // Why: evict stale closed pages — prevents "Target page, context or browser has been closed"
    // errors when Playwright kills a page (e.g. after a crash or idle timeout) but the map
    // still holds the dead reference.
    if (page && page.isClosed()) {
        closePage(tabId);
        page = undefined;
    }
    if (!page) {
        let context;
        if ((0, proxy_config_1.isCdpMode)()) {
            // Why: in CDP mode we're attached to the user's real Chrome — browser.contexts()[0]
            // IS their Default profile, including all cookies, localStorage, and active sessions.
            // Creating a newContext() would spin up an incognito window and lose everything.
            const existingContexts = browser.contexts();
            context = (_a = existingContexts[0]) !== null && _a !== void 0 ? _a : await browser.newContext();
            console.log(`[CDP] Using real Chrome profile context (${existingContexts.length} context(s) available)`);
            // Why: each UI tab maps to its OWN Chrome tab via CDP — create a new page per tabId
            // so the user sees distinct real browser tabs matching the UI workflow tabs.
            // Previous behaviour reused an existing page, causing all proxy tabs to fight over one Chrome tab.
            page = await context.newPage();
            console.log(`[CDP] Opened new Chrome tab for tabId=${tabId} (${context.pages().length} tab(s) in Chrome)`);
        }
        else {
            // Why: restore prior session (cookies + localStorage) so logins persist across Cloud Run
            // restarts and cold starts — user never has to log in again after the first session.
            const savedSession = await (0, proxy_session_service_1.loadSession)(userId);
            context = await browser.newContext(Object.assign({ userAgent: STEALTH_UA, viewport: { width: 1280, height: 800 }, locale: 'en-US', timezoneId: 'America/New_York', extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' } }, (savedSession ? { storageState: savedSession } : {})));
            if (savedSession)
                console.log(`[Session] Restored cookies for user: ${userId}`);
            // Why: hide navigator.webdriver + add fake plugin/language signals before any page script runs
            await context.addInitScript(STEALTH_INIT_SCRIPT);
        }
        // In normal mode create a new page; CDP mode already assigned page above.
        if (!page)
            page = await context.newPage();
        await setupRequestBlocking(page);
        exports.activePages.set(tabId, page);
        exports.activeContexts.set(tabId, context);
        activeUserIds.set(tabId, userId);
        // Why: buffer console.log/error from the page for CDP /cdp/console endpoint
        (0, proxy_cdp_service_1.attachConsoleListener)(tabId, page);
        // Why: attach the URL watcher BEFORE any navigation. Uses page.exposeFunction
        // (CDP Runtime.addBinding) to call back into Node.js on every URL change —
        // full HTTP navs (via DOMContentLoaded), SPA pushState/replaceState, and hash changes.
        // This is more reliable and covers all cases vs. framenavigated alone.
        await (0, proxy_url_watcher_1.attachUrlWatcher)(page, tabId, userId);
        // Why: keep settledUrls current for navigations the PAGE triggers itself (JS redirects,
        // meta-refresh, CAPTCHA auto-continue) — without this the dedup check in guardedNavigate
        // stays stale and re-navigates back into a bot-check loop.
        // Debounce: mark tab as redirecting so captureAndSync won't fire mid-chain and snapshot
        // an intermediate URL that would cause Firestore to loop back to the wrong destination.
        page.on('framenavigated', (frame) => {
            if (frame !== page.mainFrame())
                return;
            const url = frame.url();
            (0, proxy_nav_controller_1.syncSettledUrl)(tabId, url);
            // Why: 2FA/auth pages require user interaction for 45s+. Holding the debounce
            // for 60 s prevents the sync from clearing mid-verification and stops the LLM
            // from acting on a stale mid-redirect screenshot.
            const debounceMs = is2FAPage(url) ? 60000 : 1500;
            const is2FA = debounceMs === 60000;
            console.debug(`[NavEvent] framenavigated tab=${tabId} url=${url} debounce=${debounceMs}ms${is2FA ? ' ⚠️2FA-PAGE' : ''}`);
            redirectingTabs.add(tabId);
            const existing = redirectDebounceTimers.get(tabId);
            if (existing)
                clearTimeout(existing);
            const timer = setTimeout(() => {
                redirectingTabs.delete(tabId);
                redirectDebounceTimers.delete(tabId);
                // Why: immediately capture + save after debounce clears — ensures post-2FA auth cookies
                // and the final settled URL reach Firestore right away, not at the next 5s tick.
                const p = exports.activePages.get(tabId);
                const ctx = exports.activeContexts.get(tabId);
                const uid = activeUserIds.get(tabId) || 'default';
                if (p && ctx && !closedTabs.has(tabId)) {
                    console.debug(`[NavEvent] ✅ debounce cleared tab=${tabId} — triggering immediate capture`);
                    captureAndSync(tabId, uid, p, ctx);
                    if (!(0, proxy_config_1.isCdpMode)() && uid !== 'default')
                        (0, proxy_session_service_1.saveSession)(uid, ctx).catch(() => { });
                }
            }, debounceMs);
            redirectDebounceTimers.set(tabId, timer);
        });
        // Why: save immediately when the server sets new cookies (login, consent, auth tokens)
        // so the session isn't lost if the container recycles before the next interval tick.
        // Skip in CDP mode — Chrome already persists its own cookies to the real profile.
        if (!(0, proxy_config_1.isCdpMode)()) {
            page.on('response', (response) => {
                if (response.headers()['set-cookie']) {
                    console.debug(`[Session] 🍪 set-cookie detected on ${response.url()} — saving session for ${userId}`);
                    (0, proxy_session_service_1.saveSession)(userId, context).catch(() => { });
                }
            });
            // Why: save on every full page load — covers SPAs that update localStorage after hydration
            page.on('load', () => {
                console.debug(`[Session] 📄 page load — saving session for ${userId} url=${page.url()}`);
                (0, proxy_session_service_1.saveSession)(userId, context).catch(() => { });
            });
        }
        if (userId && userId !== 'default') {
            console.log(`[Session] 💾 User data path: ${(0, proxy_session_service_1.sessionFilePath)(userId)}`);
        }
        // Why: screenshot sync every 5s; session saved every 10s (2nd tick) — more aggressive
        // than the previous 20s to reduce cookie loss window on container recycle.
        let sessionTickCount = 0;
        const interval = setInterval(() => {
            console.debug(`[Interval] tick tab=${tabId} tick#${sessionTickCount + 1} url=${page.url()}`);
            captureAndSync(tabId, userId, page, context);
            sessionTickCount++;
            // Why: skip session save in CDP mode — Chrome owns its own cookies.
            if (!(0, proxy_config_1.isCdpMode)() && sessionTickCount % 2 === 0)
                (0, proxy_session_service_1.saveSession)(userId, context).catch(() => { }); // every ~10s
        }, 5000);
        syncIntervals.set(tabId, interval);
    }
    const currentUrl = page.url();
    if (targetUrl && (currentUrl === 'about:blank' || (!currentUrl.includes(targetUrl) && !targetUrl.includes(currentUrl)))) {
        // Why: guardedNavigate provides mutex + redirect resolution; captureAndSync adds screenshot
        await (0, proxy_nav_controller_1.guardedNavigate)(page, tabId, targetUrl);
        await captureAndSync(tabId, userId, page, exports.activeContexts.get(tabId));
        // Why: save cookies/localStorage immediately after every navigation — captures logins,
        // consent cookies, and site state before Cloud Run can recycle the container.
        if (!(0, proxy_config_1.isCdpMode)())
            (0, proxy_session_service_1.saveSession)(userId, exports.activeContexts.get(tabId)).catch(() => { });
    }
    return page;
}
function closePage(id) {
    // Why: mark closed FIRST — any concurrent captureAndSync still awaiting screenshot will bail
    console.log(`[Page] 🗑️  closing tab=${id}`);
    closedTabs.add(id);
    (0, proxy_cdp_service_1.clearConsoleLogs)(id); // free the per-tab console buffer
    (0, proxy_url_watcher_1.clearUrlWatcher)(id); // free URL watcher debounce state + last-url cache
    if (syncIntervals.has(id)) {
        clearInterval(syncIntervals.get(id));
        syncIntervals.delete(id);
    }
    // Clean up redirect debounce state
    if (redirectDebounceTimers.has(id)) {
        clearTimeout(redirectDebounceTimers.get(id));
        redirectDebounceTimers.delete(id);
    }
    redirectingTabs.delete(id);
    // Why: save session before closing so cookies survive tab close + Cloud Run recycling
    const userId = activeUserIds.get(id);
    const context = exports.activeContexts.get(id);
    if (userId && context)
        (0, proxy_session_service_1.saveSession)(userId, context).catch(() => { });
    activeUserIds.delete(id);
    if (exports.activePages.has(id)) {
        exports.activePages.get(id).close().catch(() => { });
        exports.activePages.delete(id);
    }
    if (exports.activeContexts.has(id)) {
        exports.activeContexts.get(id).close().catch(() => { });
        exports.activeContexts.delete(id);
    }
}
/**
 * Publicly trigger an immediate captureAndSync for a tab.
 * Why: click/action routes call this after user interactions so Firestore reflects the
 * new URL/screenshot without waiting for the 5-second periodic interval.
 */
async function captureAndSyncTab(tabId) {
    const page = exports.activePages.get(tabId);
    const context = exports.activeContexts.get(tabId);
    const userId = activeUserIds.get(tabId) || 'default';
    if (!page || !context)
        return;
    await captureAndSync(tabId, userId, page, context);
}
/** Force-save cookies for a tab — call after login/form-submit actions to persist immediately. */
async function saveSessionForTab(tabId) {
    const userId = activeUserIds.get(tabId);
    const context = exports.activeContexts.get(tabId);
    if (!userId || userId === 'default' || !context)
        return;
    await (0, proxy_session_service_1.saveSession)(userId, context).catch(() => { });
}
// Why: Playwright is the central command center.
// Navigation is driven exclusively by direct API calls (POST /proxy/navigate, etc.).
// Firestore is write-only from this process — used to broadcast state to the frontend.
/**
 * Close every proxy Playwright session for a given user.
 * Called when the user explicitly exits their workspace so no orphaned containers linger.
 */
function closeAllPagesForUser(userId) {
    for (const [tabId, uid] of activeUserIds.entries()) {
        if (uid === userId)
            closePage(tabId);
    }
}
//# sourceMappingURL=proxy-page-handler.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activePages = exports.activeContexts = void 0;
exports.getPersistentPage = getPersistentPage;
exports.closePage = closePage;
exports.captureAndSyncTab = captureAndSyncTab;
exports.saveSessionForTab = saveSessionForTab;
// Feature: Page Lifecycle | Trace: README.md
const proxy_config_1 = require("./proxy-config");
const proxy_nav_controller_1 = require("./proxy-nav-controller");
const proxy_session_service_1 = require("./proxy-session.service");
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
let firestoreAvailable = true;
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
    if (closedTabs.has(tabId))
        return;
    if (!firestoreAvailable)
        return;
    // Why: never broadcast about:blank — prevents overwriting a real URL with a transitional blank state
    const currentUrl = page.url();
    if (!currentUrl || currentUrl === 'about:blank' || currentUrl === 'about:newtab')
        return;
    try {
        const screenshot = (await page.screenshot({ quality: 60, type: 'jpeg' })).toString('base64');
        await proxy_config_1.db.collection('browser_tabs').doc(tabId).set(Object.assign(Object.assign({ id: tabId, screenshot: `data:image/jpeg;base64,${screenshot}`, url: page.url(), title: (await page.title()) || 'Loading...', source: 'proxy' }, (userId && userId !== 'default' ? { user_id: userId, isActive: true } : {})), { last_sync: new Date().toISOString() }), { merge: true });
    }
    catch (e) {
        if (e.message.includes('credentials') || e.message.includes('Could not load the default')) {
            firestoreAvailable = false;
            console.warn(`[Proxy] Firestore sync disabled (no credentials). Screenshots available via /screenshot route.`);
        }
        else if (!e.message.includes('Target closed') && !e.message.includes('Execution context was destroyed')) {
            console.error(`[Proxy] Sync failed:`, e.message);
        }
    }
}
async function getPersistentPage(targetUrl, tabId, userId = 'default') {
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
        // Why: restore prior session (cookies + localStorage) so logins persist across Cloud Run
        // restarts and cold starts — user never has to log in again after the first session.
        const savedSession = await (0, proxy_session_service_1.loadSession)(userId);
        const context = await browser.newContext(Object.assign({ userAgent: STEALTH_UA, viewport: { width: 1280, height: 800 }, locale: 'en-US', timezoneId: 'America/New_York', extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' } }, (savedSession ? { storageState: savedSession } : {})));
        if (savedSession)
            console.log(`[Session] Restored cookies for user: ${userId}`);
        // Why: hide navigator.webdriver + add fake plugin/language signals before any page script runs
        await context.addInitScript(STEALTH_INIT_SCRIPT);
        page = await context.newPage();
        await setupRequestBlocking(page);
        exports.activePages.set(tabId, page);
        exports.activeContexts.set(tabId, context);
        activeUserIds.set(tabId, userId);
        // Why: keep settledUrls current for navigations the PAGE triggers itself (JS redirects,
        // meta-refresh, CAPTCHA auto-continue) — without this the dedup check in guardedNavigate
        // stays stale and re-navigates back into a bot-check loop.
        page.on('framenavigated', (frame) => {
            if (frame === page.mainFrame())
                (0, proxy_nav_controller_1.syncSettledUrl)(tabId, frame.url());
        });
        // Why: save immediately when the server sets new cookies (login, consent, auth tokens)
        // so the session isn't lost if the container recycles before the next interval tick.
        page.on('response', (response) => {
            if (response.headers()['set-cookie']) {
                (0, proxy_session_service_1.saveSession)(userId, context).catch(() => { });
            }
        });
        // Why: save on every full page load — covers SPAs that update localStorage after hydration
        page.on('load', () => {
            (0, proxy_session_service_1.saveSession)(userId, context).catch(() => { });
        });
        if (userId && userId !== 'default') {
            console.log(`[Session] 💾 User data path: ${(0, proxy_session_service_1.sessionFilePath)(userId)}`);
        }
        // Why: screenshot sync every 5s; session saved every 10s (2nd tick) — more aggressive
        // than the previous 20s to reduce cookie loss window on container recycle.
        let sessionTickCount = 0;
        const interval = setInterval(() => {
            captureAndSync(tabId, userId, page, context);
            sessionTickCount++;
            if (sessionTickCount % 2 === 0)
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
        (0, proxy_session_service_1.saveSession)(userId, exports.activeContexts.get(tabId)).catch(() => { });
    }
    return page;
}
function closePage(id) {
    // Why: mark closed FIRST — any concurrent captureAndSync still awaiting screenshot will bail
    closedTabs.add(id);
    if (syncIntervals.has(id)) {
        clearInterval(syncIntervals.get(id));
        syncIntervals.delete(id);
    }
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
//# sourceMappingURL=proxy-page-handler.js.map
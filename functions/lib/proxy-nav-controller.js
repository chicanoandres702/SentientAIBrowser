"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearNav = exports.getSettledUrl = exports.isNavLocked = void 0;
exports.syncSettledUrl = syncSettledUrl;
exports.isBotCheckUrl = isBotCheckUrl;
exports.guardedNavigate = guardedNavigate;
const proxy_config_1 = require("./proxy-config");
// Per-tab navigation lock — only one active page.goto at a time
const navLocks = new Map();
// Per-tab last settled (final) URL after all redirects resolve
const settledUrls = new Map();
const isNavLocked = (tabId) => navLocks.get(tabId) === true;
exports.isNavLocked = isNavLocked;
const getSettledUrl = (tabId) => settledUrls.get(tabId);
exports.getSettledUrl = getSettledUrl;
const clearNav = (tabId) => { navLocks.delete(tabId); settledUrls.delete(tabId); };
exports.clearNav = clearNav;
/**
 * Called by the page's framenavigated listener so settledUrls never goes stale
 * after a JS-redirect or CAPTCHA auto-continue that happens WITHOUT a page.goto call.
 */
function syncSettledUrl(tabId, url) {
    if (url && url !== 'about:blank' && url !== 'about:newtab') {
        settledUrls.set(tabId, url);
    }
}
// Why: These URL patterns are bot-check / human-verification gates.
// When we land on one we must pause execution and tell the user — NOT navigate away,
// which would restart the loop.
const BOT_CHECK_PATTERNS = [
    /google\.com\/sorry/,
    /google\.com\/recaptcha/,
    /accounts\.google\.com\/ServiceLogin/,
    /cloudflare\.com\/challenge/,
    /hcaptcha\.com/,
    /\/captcha\//,
    /\/challenge\//,
    /\/verify\//,
    /bot-check/,
];
function isBotCheckUrl(url) {
    return BOT_CHECK_PATTERNS.some(p => p.test(url));
}
/**
 * Navigate with lock + redirect resolution.
 * Why: raw page.goto has no mutex, so rapid calls from Firestore listener + LLM + user
 * create concurrent navigations that fight each other and cause redirect oscillation.
 *
 * After settling, writes source:'proxy' + finalUrl to Firestore so the Firestore
 * listener does NOT re-react to its own write (breaks the self-echo loop).
 */
async function guardedNavigate(page, tabId, targetUrl) {
    // Lock held — drop duplicate; return current settled state
    if (navLocks.get(tabId)) {
        const url = settledUrls.get(tabId) || page.url();
        return { finalUrl: url, wasRedirected: false, isBotCheck: isBotCheckUrl(url) };
    }
    // Already at this exact destination — skip the goto entirely
    const currentUrl = page.url();
    if (currentUrl === targetUrl && settledUrls.get(tabId) === targetUrl) {
        return { finalUrl: targetUrl, wasRedirected: false, isBotCheck: isBotCheckUrl(targetUrl) };
    }
    // Why: log bot-check but DON'T refuse — stealth headers may bypass it, and
    // refusing navigation stalls the mission permanently with no recovery path.
    if (isBotCheckUrl(currentUrl)) {
        console.warn(`[NavCtrl] Bot-check on tab ${tabId}: ${currentUrl} — proceeding with navigation attempt.`);
    }
    navLocks.set(tabId, true);
    try {
        // Why: defensive guard — if the page was closed between the caller's isClosed check
        // and this point, abort cleanly instead of throwing a Playwright "Target closed" error.
        if (page.isClosed())
            throw new Error('Page was closed before navigation could start');
        await page.setViewportSize({ width: 1280, height: 800 });
        await page
            .goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
            .catch(e => console.error(`[NavCtrl] goto error for ${tabId}:`, e.message));
        const finalUrl = page.url();
        const wasRedirected = finalUrl !== targetUrl;
        const botCheck = isBotCheckUrl(finalUrl);
        settledUrls.set(tabId, finalUrl);
        if (botCheck) {
            console.warn(`[NavCtrl] Bot-check after navigation on tab ${tabId}: ${finalUrl}`);
        }
        else if (wasRedirected) {
            console.log(`[NavCtrl] Redirect: ${targetUrl} → ${finalUrl} (tab: ${tabId})`);
        }
        // Write source:'proxy' so startFirestoreListener skips this update (self-echo guard)
        try {
            await proxy_config_1.db.collection('browser_tabs').doc(tabId).set({ url: finalUrl, source: 'proxy', last_sync: new Date().toISOString(), isBotCheck: botCheck }, { merge: true });
        }
        catch ( /* Non-fatal: no credentials in local dev */_a) { /* Non-fatal: no credentials in local dev */ }
        return { finalUrl, wasRedirected, isBotCheck: botCheck };
    }
    finally {
        navLocks.delete(tabId);
    }
}
//# sourceMappingURL=proxy-nav-controller.js.map
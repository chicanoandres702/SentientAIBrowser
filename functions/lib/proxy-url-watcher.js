"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachUrlWatcher = attachUrlWatcher;
exports.clearUrlWatcher = clearUrlWatcher;
const proxy_config_1 = require("./proxy-config");
const proxy_tab_sync_broker_1 = require("./proxy-tab-sync.broker");
// Why: deduplicate rapid-fire calls (pushState can fire multiple times per navigation).
const lastSyncedUrl = new Map();
// Why: debounce timer so a flurry of pushState calls (wizard pages, param updates) coalesces
// into one Firestore write instead of hammering the DB on every keystroke/state update.
const urlDebounceTimers = new Map();
const URL_DEBOUNCE_MS = 200;
function pushUrlToFirestore(tabId, userId, url) {
    if (!url || url === 'about:blank' || url === 'about:newtab')
        return;
    if (lastSyncedUrl.get(tabId) === url)
        return; // exact-duplicate suppression
    lastSyncedUrl.set(tabId, url);
    const existing = urlDebounceTimers.get(tabId);
    if (existing)
        clearTimeout(existing);
    urlDebounceTimers.set(tabId, setTimeout(() => {
        urlDebounceTimers.delete(tabId);
        // Why: broadcast via WebSocket FIRST — zero Firestore roundtrip, no echo loop.
        // Server is the authority; client updates address bar without writing back to Firestore.
        (0, proxy_tab_sync_broker_1.broadcastTabSync)(tabId, { type: 'url', tabId, url, title: '' });
        // Why: still persist to Firestore for cold-start session restore + auth queries.
        // The client IGNORES this write for address-bar purposes (applyServerSync locks isSyncingRef).
        proxy_config_1.db.collection('browser_tabs').doc(tabId).set(Object.assign({ id: tabId, url, source: 'proxy', last_sync: new Date().toISOString() }, (userId && userId !== 'default' ? { user_id: userId } : {})), { merge: true })
            .then(() => console.debug(`[UrlWatcher] ✅ synced tab=${tabId} url=${url}`))
            .catch((e) => console.warn(`[UrlWatcher] ⚠️ Firestore write failed tab=${tabId}:`, e.message));
    }, URL_DEBOUNCE_MS));
}
/**
 * Attach the URL watcher to a freshly created Playwright page.
 *
 * Why exposeFunction:
 *   Playwright uses the CDP Runtime.addBinding API under the hood. The browser calls
 *   the bound function synchronously via the CDP WebSocket — no polling, no HTTP round-trip.
 *   Init script patches history.pushState / replaceState / hashchange so every SPA route
 *   change calls __pwUrlSync, which Playwright delivers via CDP to our Node.js callback.
 *
 * Call this BEFORE any page.goto so the init script is in place for the first navigation.
 */
async function attachUrlWatcher(page, tabId, userId) {
    // Why: exposeFunction injects __pwUrlSync into window via CDP Runtime.addBinding.
    // It survives navigations — Playwright re-injects on every new document automatically.
    await page.exposeFunction('__pwUrlSync', (url) => {
        pushUrlToFirestore(tabId, userId, url);
    });
    // Why: init script runs before any page JS on every navigation (new document).
    // Patching pushState/replaceState here covers SPAs (React Router, Next.js, Vue Router).
    // hashchange covers anchor-link navigation and old-style hash-based routers.
    await page.addInitScript(`(function () {
        function notify() {
            if (typeof __pwUrlSync === 'function') __pwUrlSync(location.href);
        }
        var _push = history.pushState.bind(history);
        var _replace = history.replaceState.bind(history);
        history.pushState = function() { _push.apply(history, arguments); notify(); };
        history.replaceState = function() { _replace.apply(history, arguments); notify(); };
        window.addEventListener('hashchange', notify);
        window.addEventListener('popstate', notify);
        // Why: fire notify on DOMContentLoaded so full HTTP navigations (302 redirects,
        // SAML SSO, server-side redirects) also push the resolved URL to Firestore
        // without relying on a separate framenavigated handler.
        window.addEventListener('DOMContentLoaded', notify, { once: true });
    })();`);
    // Why: addInitScript only runs on FUTURE navigations. When attaching to an existing
    // page (CDP mode with a real already-loaded Chrome tab), the init script never runs
    // on the current document. Evaluate the patch directly so we get the current URL
    // immediately and pushState/replaceState are hooked right now — no reload required.
    await page.evaluate(`(function () {
        if (window.__pwUrlSyncPatched) return;
        window.__pwUrlSyncPatched = true;
        function notify() {
            if (typeof __pwUrlSync === 'function') __pwUrlSync(location.href);
        }
        var _push = history.pushState.bind(history);
        var _replace = history.replaceState.bind(history);
        history.pushState = function() { _push.apply(history, arguments); notify(); };
        history.replaceState = function() { _replace.apply(history, arguments); notify(); };
        window.addEventListener('hashchange', notify);
        window.addEventListener('popstate', notify);
        notify(); // push current URL to Firestore immediately
    })();`).catch(() => { }); // swallow if context not ready yet (about:blank, crashed tabs)
}
/** Remove watcher state when a tab is closed — prevents memory leak on long-running containers. */
function clearUrlWatcher(tabId) {
    lastSyncedUrl.delete(tabId);
    const t = urlDebounceTimers.get(tabId);
    if (t) {
        clearTimeout(t);
        urlDebounceTimers.delete(tabId);
    }
}
//# sourceMappingURL=proxy-url-watcher.js.map
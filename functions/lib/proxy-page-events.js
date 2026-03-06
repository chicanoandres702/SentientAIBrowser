"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachPageEventListeners = attachPageEventListeners;
const proxy_config_1 = require("./proxy-config");
const proxy_nav_controller_1 = require("./proxy-nav-controller");
const proxy_session_service_1 = require("./proxy-session.service");
const proxy_capture_service_1 = require("./proxy-capture.service");
const proxy_stealth_config_1 = require("./proxy-stealth.config");
const proxy_page_registry_1 = require("./proxy-page-registry");
/**
 * Attach all lifetime event listeners to a page after creation.
 * Why: extracted from getPersistentPage to keep that function under 100 lines.
 */
function attachPageEventListeners(page, tabId, userId, context) {
    // Why: debounce redirect chains — natural JS/meta redirects fire multiple framenavigated events.
    // captureAndSync during a chain would snapshot an intermediate URL and write it to
    // Firestore, causing the frontend to re-navigate back — a redirect echo loop.
    page.on('framenavigated', (frame) => {
        if (frame !== page.mainFrame())
            return;
        const url = frame.url();
        (0, proxy_nav_controller_1.syncSettledUrl)(tabId, url);
        // Why: 2FA/auth pages require human interaction for 45s+. Hold debounce for 60s.
        const debounceMs = (0, proxy_stealth_config_1.is2FAPage)(url) ? 60000 : 1500;
        console.debug(`[NavEvent] framenavigated tab=${tabId} url=${url} debounce=${debounceMs}ms${debounceMs === 60000 ? ' ⚠️2FA-PAGE' : ''}`);
        proxy_page_registry_1.redirectingTabs.add(tabId);
        const existing = proxy_page_registry_1.redirectDebounceTimers.get(tabId);
        if (existing)
            clearTimeout(existing);
        const timer = setTimeout(() => {
            proxy_page_registry_1.redirectingTabs.delete(tabId);
            proxy_page_registry_1.redirectDebounceTimers.delete(tabId);
            const p = proxy_page_registry_1.activePages.get(tabId);
            const ctx = proxy_page_registry_1.activeContexts.get(tabId);
            const uid = proxy_page_registry_1.activeUserIds.get(tabId) || 'default';
            if (p && ctx && !proxy_page_registry_1.closedTabs.has(tabId)) {
                console.debug(`[NavEvent] ✅ debounce cleared tab=${tabId} — triggering immediate capture`);
                (0, proxy_capture_service_1.captureAndSync)(tabId, uid, p, ctx);
                if (!(0, proxy_config_1.isCdpMode)() && uid !== 'default')
                    (0, proxy_session_service_1.saveSession)(uid, ctx).catch(() => { });
            }
        }, debounceMs);
        proxy_page_registry_1.redirectDebounceTimers.set(tabId, timer);
    });
    if ((0, proxy_config_1.isCdpMode)())
        return; // Chrome owns its own cookies in CDP mode — skip session saves
    // Why: save immediately when the server sets new cookies (login, consent, auth tokens)
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
//# sourceMappingURL=proxy-page-events.js.map
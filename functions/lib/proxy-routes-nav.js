"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupNavRoute = setupNavRoute;
const proxy_route_utils_1 = require("./proxy-route.utils");
const proxy_page_handler_1 = require("./proxy-page-handler");
const proxy_nav_controller_1 = require("./proxy-nav-controller");
const proxy_config_1 = require("./proxy-config");
/**
 * POST /proxy/navigate
 * Body: { url, tabId? }
 * Returns: { finalUrl, wasRedirected }
 *
 * Why: The frontend calls this instead of writing URL_A to Firestore and waiting for
 * the Firestore listener roundtrip. It gets the RESOLVED url (after all server-side
 * redirects) back immediately, then writes finalUrl to Firestore — so the LLM always
 * sees the real destination, not the original requested URL.
 */
function setupNavRoute(app) {
    app.options('/proxy/navigate', (_req, res) => {
        (0, proxy_route_utils_1.applyCorsHeaders)(res);
        res.sendStatus(204);
    });
    app.post('/proxy/navigate', async (req, res) => {
        var _a;
        (0, proxy_route_utils_1.applyCorsHeaders)(res);
        const { url, tabId = 'default' } = req.body;
        if (!url)
            return res.status(400).json({ error: 'url required' });
        // Return 409 instead of silently dropping — lets client decide to retry or wait
        if ((0, proxy_nav_controller_1.isNavLocked)(tabId)) {
            return res.status(409).json({ error: 'Navigation already in progress', tabId });
        }
        try {
            // Ensure a page exists for this tab (creates one if needed)
            let page = (_a = proxy_page_handler_1.activePages.get(tabId)) !== null && _a !== void 0 ? _a : undefined;
            if (!page)
                page = await (0, proxy_page_handler_1.getPersistentPage)(url, tabId).catch(() => undefined);
            if (!page)
                return res.status(503).json({ error: 'No active session for tab' });
            const result = await (0, proxy_nav_controller_1.guardedNavigate)(page, tabId, url);
            return res.json(result);
        }
        catch (e) {
            console.error('[/proxy/navigate] Error:', e.message);
            return res.status(500).json({ error: e.message });
        }
    });
    /**
     * DELETE /proxy/tab/:tabId
     * Why: When the user closes a tab in the UI, the 5-second captureAndSync interval
     * must be cleared before the Firestore doc is removed. Without this, the interval
     * fires after the doc is deleted and re-creates it — causing the tab to ghost back.
     * This endpoint kills the interval, closes the Playwright page + context cleanly.
     */
    app.delete('/proxy/tab/:tabId', async (req, res) => {
        (0, proxy_route_utils_1.applyCorsHeaders)(res);
        const { tabId } = req.params;
        try {
            (0, proxy_page_handler_1.closePage)(tabId); // clears interval + closes page + closes context
            // Also purge from Firestore so there is no stale doc if the client's
            // removeTabFromFirestore call races with the last captureAndSync write
            try {
                await proxy_config_1.db.collection('browser_tabs').doc(tabId).delete();
            }
            catch ( /* non-fatal */_a) { /* non-fatal */ }
            return res.json({ success: true, tabId });
        }
        catch (e) {
            return res.status(500).json({ error: e.message });
        }
    });
}
//# sourceMappingURL=proxy-routes-nav.js.map
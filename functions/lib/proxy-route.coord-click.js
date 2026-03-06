"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupCoordClickRoute = setupCoordClickRoute;
const proxy_route_utils_1 = require("./proxy-route.utils");
const proxy_page_handler_1 = require("./proxy-page-handler");
function setupCoordClickRoute(app) {
    app.post('/proxy/click', async (req, res) => {
        (0, proxy_route_utils_1.applyCorsHeaders)(res);
        const { x, y, tabId = 'default' } = req.body;
        const page = proxy_page_handler_1.activePages.get(tabId);
        if (!page)
            return res.status(503).json({ error: 'No active session' });
        try {
            const urlBefore = page.url();
            await page.mouse.click(Number(x), Number(y));
            await page.waitForLoadState('domcontentloaded', { timeout: 2000 }).catch(() => { });
            await (0, proxy_page_handler_1.captureAndSyncTab)(tabId);
            if (page.url() !== urlBefore)
                await (0, proxy_page_handler_1.saveSessionForTab)(tabId);
            return res.json({ success: true, finalUrl: page.url() });
        }
        catch (e) {
            return res.status(500).json({ error: e.message });
        }
    });
}
//# sourceMappingURL=proxy-route.coord-click.js.map
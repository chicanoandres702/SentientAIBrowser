"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupActionRoute = setupActionRoute;
const proxy_page_handler_1 = require("./proxy-page-handler");
const proxy_route_utils_1 = require("./proxy-route.utils");
const playwright_mcp_1 = require("./features/playwright-mcp");
function setupActionRoute(app) {
    app.post('/proxy/action', async (req, res) => {
        (0, proxy_route_utils_1.applyCorsHeaders)(res);
        const { url, action, id, value, tabId = 'default', role, name: ariaName, text: ariaText } = req.body;
        const page = proxy_page_handler_1.activePages.get(tabId) || (await (0, proxy_page_handler_1.getPersistentPage)(url, tabId).catch(() => null));
        if (!page)
            return res.status(500).json({ error: 'Session died' });
        try {
            const finalUrl = await (0, playwright_mcp_1.executeAriaAction)(page, { action: action, role: role, ariaName: ariaName, ariaText: ariaText, id: id, value: value });
            await (0, proxy_page_handler_1.captureAndSyncTab)(tabId);
            return res.json({ success: true, finalUrl });
        }
        catch (e) {
            return res.status(500).json({ error: e.message });
        }
    });
}
//# sourceMappingURL=proxy-route.action.js.map
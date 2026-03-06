"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupScreenshotRoute = setupScreenshotRoute;
const proxy_route_utils_1 = require("./proxy-route.utils");
function setupScreenshotRoute(app) {
    app.get('/screenshot', async (req, res) => {
        try {
            const tabId = req.query.tabId || 'default';
            (0, proxy_route_utils_1.applyCorsHeaders)(res);
            const url = req.query.url;
            const page = await (0, proxy_route_utils_1.resolvePage)(tabId, url);
            if (!page)
                return res.status(url ? 503 : 404).json({ error: url ? 'Session unavailable' : 'No active session for this tabId' });
            if (page.isClosed())
                return res.status(503).json({ error: 'Session closed' });
            const buf = await page.screenshot({ quality: 70, type: 'jpeg', timeout: 8000 });
            return res.json({ screenshot: `data:image/jpeg;base64,${buf.toString('base64')}` });
        }
        catch (e) {
            return res.status(500).json({ error: e.message });
        }
    });
}
//# sourceMappingURL=proxy-route.screenshot.js.map
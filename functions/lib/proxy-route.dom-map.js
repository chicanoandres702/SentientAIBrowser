"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupDomMapRoute = setupDomMapRoute;
const proxy_route_utils_1 = require("./proxy-route.utils");
const proxy_dom_map_1 = require("./proxy-dom-map");
function setupDomMapRoute(app) {
    app.get('/proxy/dom-map', async (req, res) => {
        try {
            const tabId = req.query.tabId || 'default';
            (0, proxy_route_utils_1.applyCorsHeaders)(res);
            const url = req.query.url;
            const page = await (0, proxy_route_utils_1.resolvePage)(tabId, url);
            if (!page)
                return res.status(url ? 503 : 404).json({ error: url ? 'Session unavailable' : 'No active session for this tabId' });
            if (page.isClosed())
                return res.status(503).json({ error: 'Session closed' });
            try {
                const payload = await (0, proxy_dom_map_1.buildDomMap)(page, url || '');
                return res.json(payload);
            }
            catch (_a) {
                return res.json({ map: [], viewport: { vw: 0, vh: 0 }, url: url || '' });
            }
        }
        catch (e) {
            (0, proxy_route_utils_1.applyCorsHeaders)(res);
            return res.status(500).json({ error: e.message });
        }
    });
}
//# sourceMappingURL=proxy-route.dom-map.js.map
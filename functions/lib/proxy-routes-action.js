"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupActionRoute = setupActionRoute;
exports.setupScreenshotRoute = setupScreenshotRoute;
exports.setupScreenshotStreamRoute = setupScreenshotStreamRoute;
exports.setupCoordClickRoute = setupCoordClickRoute;
exports.setupDomMapRoute = setupDomMapRoute;
const proxy_page_handler_1 = require("./proxy-page-handler");
const proxy_route_utils_1 = require("./proxy-route.utils");
const proxy_dom_map_1 = require("./proxy-dom-map");
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
/** GET /screenshot — capture page as base64 jpeg */
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
            const buf = await page.screenshot({ quality: 70, type: 'jpeg' });
            return res.json({ screenshot: `data:image/jpeg;base64,${buf.toString('base64')}` });
        }
        catch (e) {
            return res.status(500).json({ error: e.message });
        }
    });
}
/** GET /screenshot/stream — SSE stream of base64 screenshots */
function setupScreenshotStreamRoute(app) {
    const STREAM_INTERVAL_MS = 800;
    app.get('/screenshot/stream', async (req, res) => {
        var _a;
        const tabId = req.query.tabId || 'default';
        const url = req.query.url;
        (0, proxy_route_utils_1.applyCorsHeaders)(res);
        const page = await (0, proxy_route_utils_1.resolvePage)(tabId, url);
        if (!page) {
            res.status(url ? 503 : 404).end();
            return;
        }
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
        });
        (_a = res.flushHeaders) === null || _a === void 0 ? void 0 : _a.call(res);
        const timer = setInterval(async () => {
            try {
                if (page.isClosed())
                    throw new Error('Session closed');
                const buf = await page.screenshot({ quality: 65, type: 'jpeg' });
                res.write(`data: data:image/jpeg;base64,${buf.toString('base64')}\n\n`);
            }
            catch (e) {
                res.write(`event: error\ndata: ${e.message}\n\n`);
            }
        }, STREAM_INTERVAL_MS);
        req.on('close', () => clearInterval(timer));
    });
}
/** POST /proxy/click — mouse click at absolute Playwright viewport coordinates for manual pass-through */
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
/** GET /proxy/dom-map — return current DOM map + viewport for a tab */
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
//# sourceMappingURL=proxy-routes-action.js.map
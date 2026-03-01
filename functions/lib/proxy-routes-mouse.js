"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupMouseRoutes = setupMouseRoutes;
const proxy_page_handler_1 = require("./proxy-page-handler");
const proxy_route_utils_1 = require("./proxy-route.utils");
/** POST /proxy/mouse/move  — hover to (x, y) without clicking */
function setupMouseRoutes(app) {
    app.post('/proxy/mouse/move', async (req, res) => {
        (0, proxy_route_utils_1.applyCorsHeaders)(res);
        const { x, y, tabId = 'default' } = req.body;
        const page = proxy_page_handler_1.activePages.get(tabId);
        if (!page)
            return res.status(503).json({ error: 'No active session' });
        try {
            await page.mouse.move(Number(x), Number(y));
            await (0, proxy_page_handler_1.captureAndSyncTab)(tabId);
            return res.json({ success: true });
        }
        catch (e) {
            return res.status(500).json({ error: e.message });
        }
    });
    /** POST /proxy/mouse/dblclick — double-click at (x, y) */
    app.post('/proxy/mouse/dblclick', async (req, res) => {
        (0, proxy_route_utils_1.applyCorsHeaders)(res);
        const { x, y, tabId = 'default' } = req.body;
        const page = proxy_page_handler_1.activePages.get(tabId);
        if (!page)
            return res.status(503).json({ error: 'No active session' });
        try {
            await page.mouse.dblclick(Number(x), Number(y));
            await page.waitForLoadState('domcontentloaded', { timeout: 2000 }).catch(() => { });
            await (0, proxy_page_handler_1.captureAndSyncTab)(tabId);
            return res.json({ success: true, finalUrl: page.url() });
        }
        catch (e) {
            return res.status(500).json({ error: e.message });
        }
    });
    /** POST /proxy/mouse/rightclick — right-click at (x, y) — opens context menu */
    app.post('/proxy/mouse/rightclick', async (req, res) => {
        (0, proxy_route_utils_1.applyCorsHeaders)(res);
        const { x, y, tabId = 'default' } = req.body;
        const page = proxy_page_handler_1.activePages.get(tabId);
        if (!page)
            return res.status(503).json({ error: 'No active session' });
        try {
            await page.mouse.click(Number(x), Number(y), { button: 'right' });
            await (0, proxy_page_handler_1.captureAndSyncTab)(tabId);
            return res.json({ success: true });
        }
        catch (e) {
            return res.status(500).json({ error: e.message });
        }
    });
    /** POST /proxy/mouse/scroll — scroll wheel at (x, y) by (deltaX, deltaY) pixels */
    app.post('/proxy/mouse/scroll', async (req, res) => {
        (0, proxy_route_utils_1.applyCorsHeaders)(res);
        const { x: _x, y: _y, deltaX = 0, deltaY = 100, tabId = 'default' } = req.body;
        const page = proxy_page_handler_1.activePages.get(tabId);
        if (!page)
            return res.status(503).json({ error: 'No active session' });
        try {
            await page.mouse.wheel(Number(deltaX), Number(deltaY));
            await (0, proxy_page_handler_1.captureAndSyncTab)(tabId);
            return res.json({ success: true });
        }
        catch (e) {
            return res.status(500).json({ error: e.message });
        }
    });
    /**
     * POST /proxy/mouse/drag
     * Body: { fromX, fromY, toX, toY, tabId? }
     * Why: drag-and-drop interactions need mousedown → move → mouseup at precise coords.
     * Uses low-level mouse API so Playwright fires the real pointer events.
     */
    app.post('/proxy/mouse/drag', async (req, res) => {
        (0, proxy_route_utils_1.applyCorsHeaders)(res);
        const { fromX, fromY, toX, toY, tabId = 'default' } = req.body;
        const page = proxy_page_handler_1.activePages.get(tabId);
        if (!page)
            return res.status(503).json({ error: 'No active session' });
        try {
            await page.mouse.move(Number(fromX), Number(fromY));
            await page.mouse.down();
            await page.mouse.move(Number(toX), Number(toY), { steps: 10 });
            await page.mouse.up();
            await (0, proxy_page_handler_1.captureAndSyncTab)(tabId);
            return res.json({ success: true });
        }
        catch (e) {
            return res.status(500).json({ error: e.message });
        }
    });
}
//# sourceMappingURL=proxy-routes-mouse.js.map
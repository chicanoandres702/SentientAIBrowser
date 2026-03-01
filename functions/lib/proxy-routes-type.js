"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupKeyTypeRoute = setupKeyTypeRoute;
const proxy_page_handler_1 = require("./proxy-page-handler");
const proxy_route_utils_1 = require("./proxy-route.utils");
/**
 * POST /proxy/type
 * Body: { text?, key?, tabId? }
 *   text — printable characters forwarded via page.keyboard.type
 *   key  — special key name (Enter, Backspace, Tab, ArrowUp …) via page.keyboard.press
 *
 * Why: manual web-ui typing must reach Playwright so the focused element on the real
 * page receives keystrokes — not just the screenshot overlay.
 * captureAndSyncTab fires after every keystroke so Firestore (and the preview) stay current.
 */
function setupKeyTypeRoute(app) {
    app.post('/proxy/type', async (req, res) => {
        (0, proxy_route_utils_1.applyCorsHeaders)(res);
        const { text, key, tabId = 'default' } = req.body;
        if (!text && !key)
            return res.status(400).json({ error: 'text or key required' });
        const page = proxy_page_handler_1.activePages.get(tabId);
        if (!page)
            return res.status(503).json({ error: 'No active session' });
        try {
            if (text)
                await page.keyboard.type(text, { delay: 30 });
            if (key)
                await page.keyboard.press(key);
            // Brief settle so any autocomplete / submission has time to load
            await page.waitForLoadState('domcontentloaded', { timeout: 1500 }).catch(() => { });
            // Sync immediately — frontend sees the updated input state without waiting 5 s
            await (0, proxy_page_handler_1.captureAndSyncTab)(tabId);
            return res.json({ success: true, finalUrl: page.url() });
        }
        catch (e) {
            return res.status(500).json({ error: e.message });
        }
    });
}
//# sourceMappingURL=proxy-routes-type.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupActionRoute = setupActionRoute;
exports.setupScreenshotRoute = setupScreenshotRoute;
const proxy_page_handler_1 = require("./proxy-page-handler");
/** POST /proxy/action — execute click/type on a persistent page */
function setupActionRoute(app) {
    app.post('/proxy/action', async (req, res) => {
        const { url, action, id, value, tabId = 'default' } = req.body;
        let page = proxy_page_handler_1.activePages.get(tabId) || await (0, proxy_page_handler_1.getPersistentPage)(url, tabId).catch(() => null);
        if (!page)
            return res.status(500).json({ error: 'Session died' });
        try {
            const sel = `[data-ai-id="${id}"]`;
            if (action === 'click') {
                await page.evaluate((s) => { const e = document.querySelector(s); if (e) {
                    e.scrollIntoView({ block: 'center' });
                    e.click();
                } }, sel);
            }
            else if (action === 'type') {
                const el = await page.$(sel);
                if (!el)
                    throw new Error('Not found');
                await el.focus();
                await page.evaluate((s) => { document.querySelector(s).value = ''; }, sel);
                await el.type(value || '', { delay: 10 });
                await page.evaluate(s => { const e = document.querySelector(s); ['input', 'change'].forEach(t => e === null || e === void 0 ? void 0 : e.dispatchEvent(new Event(t, { bubbles: true }))); }, sel);
                if (value === null || value === void 0 ? void 0 : value.length)
                    await page.keyboard.press('Enter');
            }
            res.json({ success: true });
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    });
}
/** GET /screenshot — capture current page as base64 jpeg */
function setupScreenshotRoute(app) {
    app.get('/screenshot', async (req, res) => {
        try {
            const tabId = req.query.tabId || 'default';
            let page = proxy_page_handler_1.activePages.get(tabId);
            if (!page && req.query.url)
                page = await (0, proxy_page_handler_1.getPersistentPage)(req.query.url, tabId);
            if (!page)
                throw new Error('No active page for this tab');
            const buf = await page.screenshot({ quality: 70, type: 'jpeg' });
            res.json({ screenshot: `data:image/jpeg;base64,${buf.toString('base64')}` });
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    });
}
//# sourceMappingURL=proxy-routes-action.js.map
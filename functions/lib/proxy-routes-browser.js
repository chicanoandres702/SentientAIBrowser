"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupBrowserRoutes = setupBrowserRoutes;
// Feature: Browser | Trace: proxy-server.js
const proxy_config_1 = require("./proxy-config");
const proxy_scanner_1 = require("./proxy-scanner");
const proxy_asset_1 = require("./proxy-asset");
const proxy_page_handler_1 = require("./proxy-page-handler");
const proxy_html_service_1 = require("./proxy-html.service");
function setupBrowserRoutes(app) {
    (0, proxy_asset_1.setupAssetRoute)(app);
    app.get('/proxy', async (req, res) => {
        const { url: targetUrl, tabId = 'default' } = req.query;
        if (!targetUrl)
            return res.status(400).send('URL required');
        if ((0, proxy_asset_1.isStaticAsset)(targetUrl))
            return res.status(302).redirect(`/proxy/asset?url=${encodeURIComponent(targetUrl)}`);
        try {
            const page = await (0, proxy_page_handler_1.getPersistentPage)(targetUrl, tabId);
            if (!page)
                throw new Error('Failed to load page');
            await page.waitForSelector('body', { timeout: 5000 }).catch(() => { });
            await page.evaluate(() => {
                let id = 1;
                document.querySelectorAll('button, a, input, select, textarea, [role="button"]').forEach(el => {
                    const r = el.getBoundingClientRect(), s = window.getComputedStyle(el);
                    if (r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.opacity !== '0' && s.display !== 'none')
                        el.setAttribute('data-ai-id', (id++).toString());
                });
            });
            let html = await page.content();
            (0, proxy_config_1.stripSecurityHeaders)(res);
            res.set('Content-Type', 'text/html').status(200).send((0, proxy_scanner_1.injectScanner)((0, proxy_html_service_1.rewriteHtml)(html, targetUrl, tabId)));
        }
        catch (e) {
            res.status(500).send(`Proxy failed: ${e.message}`);
        }
    });
    app.post('/proxy/action', async (req, res) => {
        const { url, action, id, value, tabId = 'default' } = req.body;
        let page = proxy_page_handler_1.activePages.get(tabId) || await (0, proxy_page_handler_1.getPersistentPage)(url, tabId).catch(() => null);
        if (!page)
            return res.status(500).json({ error: 'Session died' });
        try {
            const sel = `[data-ai-id="${id}"]`;
            if (action === 'click')
                await page.evaluate((s) => { const e = document.querySelector(s); if (e) {
                    e.scrollIntoView({ block: 'center' });
                    e.click();
                } }, sel);
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
    app.get('/screenshot', async (req, res) => {
        try {
            const page = await (0, proxy_page_handler_1.getPersistentPage)(req.query.url, req.query.tabId || 'default');
            if (!page)
                throw new Error('No active page');
            res.json({ screenshot: `data:image/png;base64,${(await page.screenshot()).toString('base64')}` });
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    });
}
//# sourceMappingURL=proxy-routes-browser.js.map
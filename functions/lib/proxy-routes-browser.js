"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupBrowserRoutes = setupBrowserRoutes;
// Feature: Browser | Why: Core browser proxy routes — health, plan, proxy GET
const proxy_config_1 = require("./proxy-config");
const proxy_scanner_1 = require("./proxy-scanner");
const proxy_asset_1 = require("./proxy-asset");
const proxy_page_handler_1 = require("./proxy-page-handler");
const proxy_html_service_1 = require("./proxy-html.service");
const llm_mission_planner_1 = require("./features/llm/llm-mission-planner");
const proxy_routes_action_1 = require("./proxy-routes-action");
function setupBrowserRoutes(app) {
    (0, proxy_asset_1.setupAssetRoute)(app);
    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', activeTabs: Array.from(proxy_page_handler_1.activePages.keys()), uptime: process.uptime() });
    });
    app.post('/agent/plan', async (req, res) => {
        try {
            const { prompt, schemaPrompt } = req.body;
            if (!prompt)
                return res.status(400).json({ error: 'Prompt required' });
            const planResponse = await (0, llm_mission_planner_1.generateLLMPlanResponse)(prompt, schemaPrompt);
            res.json(planResponse);
        }
        catch (e) {
            console.error('Mission planning failed:', e);
            res.status(500).json({ error: 'Mission planning failed: ' + e.message });
        }
    });
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
    // Delegate action + screenshot routes to extracted module
    (0, proxy_routes_action_1.setupActionRoute)(app);
    (0, proxy_routes_action_1.setupScreenshotRoute)(app);
}
//# sourceMappingURL=proxy-routes-browser.js.map
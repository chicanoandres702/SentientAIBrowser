"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupExternalRoutes = setupExternalRoutes;
const proxy_page_handler_1 = require("./proxy-page-handler");
const api_key_middleware_1 = require("./auth/api-key.middleware");
const proxy_route_utils_1 = require("./proxy-route.utils");
const proxy_config_1 = require("./proxy-config");
const IDLE_TIMEOUT_MS = 15000;
/** Navigate to URL and wait for networkidle — shared warm-up for both routes */
async function warmPage(url, tabId) {
    const page = await (0, proxy_page_handler_1.getPersistentPage)(url, tabId);
    if (!page)
        throw new Error('Failed to load page');
    await page.waitForLoadState('networkidle', { timeout: IDLE_TIMEOUT_MS }).catch(() => { });
    return page;
}
/**
 * GET /api/render?url=...&tabId=...
 * Returns fully JS-rendered HTML with NO link rewriting or scanner injection.
 * Suitable for external scrapers, AI pipelines, and server-to-server integrations.
 */
function setupRenderRoute(app) {
    app.get('/api/render', api_key_middleware_1.apiKeyAuth, async (req, res) => {
        (0, proxy_route_utils_1.applyCorsHeaders)(res);
        const { url, tabId = 'external' } = req.query;
        if (!url)
            return res.status(400).json({ error: 'url param required' });
        try {
            const page = await warmPage(url, tabId);
            const html = await page.content();
            (0, proxy_config_1.stripSecurityHeaders)(res);
            res.set('Content-Type', 'text/html').send(html);
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    });
}
/**
 * GET /api/extract?url=...&tabId=...
 * Returns structured JSON: { url, title, text, links[], elements[] }
 * Ideal for LLM pipelines, AI agents, and structured data extraction.
 * links: up to 200 anchor hrefs + text.
 * elements: all visible interactive elements with data-ai-id for action targeting.
 * text: inner text of the page body (up to 50k chars) for context windows.
 */
function setupExtractRoute(app) {
    app.get('/api/extract', api_key_middleware_1.apiKeyAuth, async (req, res) => {
        (0, proxy_route_utils_1.applyCorsHeaders)(res);
        const { url, tabId = 'extract' } = req.query;
        if (!url)
            return res.status(400).json({ error: 'url param required' });
        try {
            const page = await warmPage(url, tabId);
            const data = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('a[href]'))
                    .map(a => { var _a; return ({ text: ((_a = a.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || '', href: a.href }); })
                    .filter(l => l.href.startsWith('http'))
                    .slice(0, 200);
                const elements = Array.from(document.querySelectorAll('button,input,select,textarea,[role="button"]'))
                    .filter(el => {
                    const r = el.getBoundingClientRect();
                    return r.width > 0 && r.height > 0;
                })
                    .map((el, i) => {
                    var _a;
                    el.setAttribute('data-ai-id', String(i + 1));
                    return {
                        id: i + 1,
                        tag: el.tagName.toLowerCase(),
                        text: ((_a = el.innerText) === null || _a === void 0 ? void 0 : _a.trim().slice(0, 120)) || '',
                        type: el.type || null,
                    };
                });
                return {
                    url: window.location.href,
                    title: document.title,
                    text: document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 50000),
                    links,
                    elements,
                };
            });
            res.json(data);
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    });
}
function setupExternalRoutes(app) {
    setupRenderRoute(app);
    setupExtractRoute(app);
}
//# sourceMappingURL=proxy-routes-external.js.map
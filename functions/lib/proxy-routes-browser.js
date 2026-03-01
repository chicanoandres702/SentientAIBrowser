"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupBrowserRoutes = setupBrowserRoutes;
const proxy_page_handler_1 = require("./proxy-page-handler");
const llm_decision_engine_1 = require("./features/llm/llm-decision.engine");
const playwright_mcp_adapter_1 = require("./playwright-mcp-adapter");
const proxy_routes_action_1 = require("./proxy-routes-action");
const proxy_routes_agent_1 = require("./proxy-routes-agent");
const proxy_routes_nav_1 = require("./proxy-routes-nav");
const proxy_routes_type_1 = require("./proxy-routes-type");
const proxy_routes_cdp_1 = require("./proxy-routes-cdp");
const proxy_routes_mouse_1 = require("./proxy-routes-mouse");
const proxy_routes_external_1 = require("./proxy-routes-external");
const proxy_routes_research_1 = require("./proxy-routes-research");
const proxy_route_utils_1 = require("./proxy-route.utils");
function setupBrowserRoutes(app) {
    // Health check — used by Cloud Run liveness probe and frontend connectivity test
    app.get('/health', (_req, res) => {
        (0, proxy_route_utils_1.applyCorsHeaders)(res);
        res.json({ status: 'ok', activeTabs: Array.from(proxy_page_handler_1.activePages.keys()), uptime: process.uptime() });
    });
    app.options('/agent/plan', (_req, res) => {
        (0, proxy_route_utils_1.applyCorsHeaders)(res);
        res.sendStatus(204);
    });
    // LLM mission planning — POST /agent/plan { prompt, tabId?, userId?, url?, schemaPrompt? }
    // Why: use the SAME decision engine as backend mission execution so UI and container
    // produce aligned segments/tasks (single planner version).
    app.post('/agent/plan', async (req, res) => {
        (0, proxy_route_utils_1.applyCorsHeaders)(res);
        const { prompt, schemaPrompt, tabId = 'default', userId: bodyUserId, url } = req.body;
        if (!prompt)
            return res.status(400).json({ error: 'prompt required' });
        try {
            const userId = bodyUserId || req.userId || 'anonymous';
            const runtimeApiKey = req.headers['x-gemini-api-key'] || undefined;
            let domain = 'general';
            let screenshotBase64;
            let ariaSnapshot;
            try {
                const page = await (0, proxy_page_handler_1.getPersistentPage)(null, tabId, userId);
                if (page) {
                    const pageUrl = page.url();
                    domain = new URL(pageUrl || 'http://blank').hostname;
                    ariaSnapshot = await (0, playwright_mcp_adapter_1.getAriaSnapshot)(page);
                    screenshotBase64 = (await page.screenshot({ quality: 30, type: 'jpeg' })).toString('base64');
                }
            }
            catch (_a) {
                if (url) {
                    try {
                        domain = new URL(url).hostname;
                    }
                    catch (_b) {
                        domain = String(url);
                    }
                }
            }
            const promptWithSchema = schemaPrompt
                ? `${prompt}\n\n${schemaPrompt}`
                : prompt;
            const missionResponse = await (0, llm_decision_engine_1.determineNextAction)(userId, promptWithSchema, [], screenshotBase64, domain, [], false, undefined, ariaSnapshot, runtimeApiKey);
            if (!missionResponse) {
                return res.status(502).json({ error: 'Mission planning failed: no response from decision engine' });
            }
            return res.json({ missionResponse });
        }
        catch (e) {
            return res.status(500).json({ error: 'Mission planning failed: ' + e.message });
        }
    });
    // Playwright control endpoints
    (0, proxy_routes_nav_1.setupNavRoute)(app); // POST /proxy/navigate, DELETE /proxy/tab/:id
    (0, proxy_routes_action_1.setupActionRoute)(app); // POST /proxy/action  (ARIA click/type)
    (0, proxy_routes_action_1.setupCoordClickRoute)(app); // POST /proxy/click   (x,y coordinate click)
    (0, proxy_routes_type_1.setupKeyTypeRoute)(app); // POST /proxy/type    (keyboard input)
    (0, proxy_routes_mouse_1.setupMouseRoutes)(app); // POST /proxy/mouse/* (mouse move/scroll)
    (0, proxy_routes_action_1.setupScreenshotRoute)(app); // GET  /screenshot
    (0, proxy_routes_action_1.setupScreenshotStreamRoute)(app); // GET /screenshot/stream (SSE)
    (0, proxy_routes_action_1.setupDomMapRoute)(app); // GET  /proxy/dom-map
    // Agent + research + CDP debug
    (0, proxy_routes_agent_1.setupAgentAnalyzeRoute)(app);
    (0, proxy_routes_research_1.setupDeepResearchRoutes)(app);
    (0, proxy_routes_cdp_1.setupCdpRoutes)(app);
    (0, proxy_routes_external_1.setupExternalRoutes)(app); // GET /api/render, GET /api/extract
}
//# sourceMappingURL=proxy-routes-browser.js.map
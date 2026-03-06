"use strict";
/**
 * Sentient File Header
 * Why: Registers all Playwright control endpoints for Sentient AI Browser
 * Filepath: functions/src/proxy-routes-browser.ts
 * Description: Orchestrates browser control routes (navigate, click, type, screenshot, etc.)
 * Trace: Used by proxy server, orchestrator, and browser sync modules
 * Wiring: Exported setup function, consumed by Express app and orchestrator
 */
/**
 * Sentient File Header
 * Why: Registers all Playwright control endpoints for Sentient AI Browser
 * Filepath: functions/src/proxy-routes-browser.ts
 * Description: Orchestrates browser control routes (navigate, click, type, screenshot, etc.)
 * Trace: Used by proxy server, orchestrator, and browser sync modules
 * Wiring: Exported setup function, consumed by Express app and orchestrator
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupBrowserRoutes = setupBrowserRoutes;
const proxy_page_handler_1 = require("./proxy-page-handler");
const proxy_routes_proxy_1 = require("./proxy-routes-proxy");
const proxy_routes_action_1 = require("./proxy-routes-action");
const proxy_routes_agent_1 = require("./proxy-routes-agent");
const proxy_routes_nav_1 = require("./proxy-routes-nav");
const proxy_routes_type_1 = require("./proxy-routes-type");
const proxy_routes_cdp_1 = require("./proxy-routes-cdp");
const proxy_routes_mouse_1 = require("./proxy-routes-mouse");
const proxy_routes_external_1 = require("./proxy-routes-external");
const proxy_routes_research_1 = require("./proxy-routes-research");
const proxy_routes_github_action_1 = require("./proxy-routes-github-action");
const proxy_routes_plan_1 = require("./proxy-routes-plan");
const proxy_routes_tasks_1 = require("./proxy-routes-tasks");
const proxy_route_utils_1 = require("./proxy-route.utils");
function setupBrowserRoutes(app) {
    // Health check — used by Cloud Run liveness probe and frontend connectivity test
    app.get('/health', (_req, res) => {
        (0, proxy_route_utils_1.applyCorsHeaders)(res);
        res.json({ status: 'ok', activeTabs: Array.from(proxy_page_handler_1.activePages.keys()), uptime: process.uptime() });
    });
    (0, proxy_routes_plan_1.setupPlanRoute)(app); // POST /agent/plan (LLM mission planning)
    (0, proxy_routes_tasks_1.setupTasksRoute)(app); // POST /proxy/tasks/:id/:op  POST /proxy/replan
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
    (0, proxy_routes_proxy_1.setupProxyRoute)(app); // GET /proxy?url=...&tabId=... (webview relay + session sync)
    (0, proxy_routes_github_action_1.setupGithubActionRoute)(app); // POST /proxy/github-scrape (triggers GH Actions Playwright job)
}
//# sourceMappingURL=proxy-routes-browser.js.map
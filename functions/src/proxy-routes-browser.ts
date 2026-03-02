// Feature: Browser | Why: Route orchestrator — registers all Playwright control endpoints.
// No HTML proxy layer: the frontend receives screenshots from Firestore, not served HTML.
// All browser control (navigate, click, type, screenshot) talks directly to Playwright.
import { Express } from 'express';
import { activePages } from './proxy-page-handler';
import { setupProxyRoute } from './proxy-routes-proxy';
import { setupActionRoute, setupCoordClickRoute, setupDomMapRoute, setupScreenshotRoute, setupScreenshotStreamRoute } from './proxy-routes-action';
import { setupAgentAnalyzeRoute } from './proxy-routes-agent';
import { setupNavRoute } from './proxy-routes-nav';
import { setupKeyTypeRoute } from './proxy-routes-type';
import { setupCdpRoutes } from './proxy-routes-cdp';
import { setupMouseRoutes } from './proxy-routes-mouse';
import { setupExternalRoutes } from './proxy-routes-external';
import { setupDeepResearchRoutes } from './proxy-routes-research';
import { setupGithubActionRoute } from './proxy-routes-github-action';
import { setupPlanRoute } from './proxy-routes-plan';
import { applyCorsHeaders } from './proxy-route.utils';

export function setupBrowserRoutes(app: Express): void {
    // Health check — used by Cloud Run liveness probe and frontend connectivity test
    app.get('/health', (_req, res) => {
        applyCorsHeaders(res);
        res.json({ status: 'ok', activeTabs: Array.from(activePages.keys()), uptime: process.uptime() });
    });

    setupPlanRoute(app);          // POST /agent/plan (LLM mission planning)

    // Playwright control endpoints
    setupNavRoute(app);           // POST /proxy/navigate, DELETE /proxy/tab/:id
    setupActionRoute(app);        // POST /proxy/action  (ARIA click/type)
    setupCoordClickRoute(app);    // POST /proxy/click   (x,y coordinate click)
    setupKeyTypeRoute(app);       // POST /proxy/type    (keyboard input)
    setupMouseRoutes(app);        // POST /proxy/mouse/* (mouse move/scroll)
    setupScreenshotRoute(app);    // GET  /screenshot
    setupScreenshotStreamRoute(app); // GET /screenshot/stream (SSE)
    setupDomMapRoute(app);        // GET  /proxy/dom-map

    // Agent + research + CDP debug
    setupAgentAnalyzeRoute(app);
    setupDeepResearchRoutes(app);
    setupCdpRoutes(app);
    setupExternalRoutes(app);     // GET /api/render, GET /api/extract
    setupProxyRoute(app);         // GET /proxy?url=...&tabId=... (webview relay + session sync)
    setupGithubActionRoute(app);  // POST /proxy/github-scrape (triggers GH Actions Playwright job)
}



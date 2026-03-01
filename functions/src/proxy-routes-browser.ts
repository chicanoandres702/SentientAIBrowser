// Feature: Browser | Why: Route orchestrator — mounts all feature routers in priority order.
// Each feature owns its own route file; this file is the single registration point.
//
// Mount order matters:
//   1. Static assets   — fast path, no Playwright
//   2. Internal APIs   — /proxy/*, /screenshot, /agent/*, /cdp
//   3. Wildcard proxy  — /:url(*) catches everything else
import { Express } from 'express';
import { setupAssetRoute } from './proxy-asset';
import { activePages } from './proxy-page-handler';
import { generateLLMPlanResponse } from './features/llm/llm-mission-planner';
import { setupActionRoute, setupCoordClickRoute, setupDomMapRoute, setupScreenshotRoute, setupScreenshotStreamRoute } from './proxy-routes-action';
import { setupAgentAnalyzeRoute } from './proxy-routes-agent';
import { setupNavRoute } from './proxy-routes-nav';
import { setupKeyTypeRoute } from './proxy-routes-type';
import { setupCdpRoutes } from './proxy-routes-cdp';
import { setupMouseRoutes } from './proxy-routes-mouse';
import { setupExternalRoutes } from './proxy-routes-external';
import { setupDeepResearchRoutes } from './proxy-routes-research';
import { proxyRouter } from './proxy-fetch.route';

export function setupBrowserRoutes(app: Express): void {
    // ── Health ──────────────────────────────────────────────────────────────
    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', activeTabs: Array.from(activePages.keys()), uptime: process.uptime() });
    });

    // ── LLM mission planner ─────────────────────────────────────────────────
    app.post('/agent/plan', async (req, res): Promise<any> => {
        const { prompt, schemaPrompt } = req.body;
        if (!prompt) return res.status(400).json({ error: 'prompt required' });
        try {
            res.json(await generateLLMPlanResponse(prompt, schemaPrompt));
        } catch (e: any) {
            res.status(500).json({ error: 'Mission planning failed: ' + e.message });
        }
    });

    // ── Feature routers (specific paths before wildcard) ────────────────────
    setupAssetRoute(app);
    setupAgentAnalyzeRoute(app);
    setupDeepResearchRoutes(app);
    setupNavRoute(app);
    setupKeyTypeRoute(app);
    setupActionRoute(app);
    setupCoordClickRoute(app);
    setupScreenshotRoute(app);
    setupScreenshotStreamRoute(app);
    setupDomMapRoute(app);
    setupMouseRoutes(app);
    setupCdpRoutes(app);
    setupExternalRoutes(app);

    // ── Wildcard proxy — MUST be last: GET|POST /:url(*) ────────────────────
    // Why: Express matches routes top-down. Mounting the wildcard last ensures all
    // named API routes are checked first — no false proxy hits on /health, /cdp, etc.
    app.use('/', proxyRouter);
}


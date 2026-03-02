// Feature: Browser | Why: Route orchestrator — registers all Playwright control endpoints.
// No HTML proxy layer: the frontend receives screenshots from Firestore, not served HTML.
// All browser control (navigate, click, type, screenshot) talks directly to Playwright.
import { Express } from 'express';
import { activePages, getPersistentPage } from './proxy-page-handler';
import { determineNextAction } from './features/llm/llm-decision.engine';
import { generateLLMPlanResponse } from './features/llm/llm-mission-planner';
import { getAriaSnapshot } from './playwright-mcp-adapter';
import { setupProxyRoute } from './proxy-routes-proxy';
import { setupActionRoute, setupCoordClickRoute, setupDomMapRoute, setupScreenshotRoute, setupScreenshotStreamRoute } from './proxy-routes-action';
import { setupAgentAnalyzeRoute } from './proxy-routes-agent';
import { setupNavRoute } from './proxy-routes-nav';
import { setupKeyTypeRoute } from './proxy-routes-type';
import { setupCdpRoutes } from './proxy-routes-cdp';
import { setupMouseRoutes } from './proxy-routes-mouse';
import { setupExternalRoutes } from './proxy-routes-external';
import { setupDeepResearchRoutes } from './proxy-routes-research';
import { applyCorsHeaders } from './proxy-route.utils';

export function setupBrowserRoutes(app: Express): void {
    // Health check — used by Cloud Run liveness probe and frontend connectivity test
    app.get('/health', (_req, res) => {
        applyCorsHeaders(res);
        res.json({ status: 'ok', activeTabs: Array.from(activePages.keys()), uptime: process.uptime() });
    });

    app.options('/agent/plan', (_req, res) => {
        applyCorsHeaders(res);
        res.sendStatus(204);
    });

    // LLM mission planning — POST /agent/plan { prompt, tabId?, userId?, url?, schemaPrompt? }
    // Why: use the SAME decision engine as backend mission execution so UI and container
    // produce aligned segments/tasks (single planner version).
    app.post('/agent/plan', async (req, res): Promise<any> => {
        applyCorsHeaders(res);
        const { prompt, schemaPrompt, tabId = 'default', userId: bodyUserId, url } = req.body;
        if (!prompt) return res.status(400).json({ error: 'prompt required' });
        try {
            const userId = bodyUserId || (req as any).userId || 'anonymous';
            const runtimeApiKey = (req.headers['x-gemini-api-key'] as string) || undefined;

            let domain = 'general';
            let screenshotBase64: string | undefined;
            let ariaSnapshot: string | undefined;

            try {
                const page = await getPersistentPage(null, tabId, userId);
                if (page) {
                    const pageUrl = page.url();
                    domain = new URL(pageUrl || 'http://blank').hostname;
                    ariaSnapshot = await getAriaSnapshot(page);
                    screenshotBase64 = (await page.screenshot({ quality: 30, type: 'jpeg' })).toString('base64');
                }
            } catch {
                if (url) {
                    try { domain = new URL(url).hostname; } catch { domain = String(url); }
                }
            }

            const promptWithSchema = schemaPrompt
                ? `${prompt}\n\n${schemaPrompt}`
                : prompt;

            const missionResponse = await determineNextAction(
                userId,
                promptWithSchema,
                [],
                screenshotBase64,
                domain,
                [],
                false,
                undefined,
                ariaSnapshot,
                runtimeApiKey,
            );

            if (!missionResponse) {
                // Why: runtime key absent — fall back to server env-key planner so planning
                // always returns a result even when the user hasn't set a key in Settings.
                const fallback = await generateLLMPlanResponse(promptWithSchema, schemaPrompt ?? undefined);
                return res.json(fallback);
            }

            return res.json({ missionResponse });
        } catch (e: any) {
            return res.status(500).json({ error: 'Mission planning failed: ' + e.message });
        }
    });

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
}



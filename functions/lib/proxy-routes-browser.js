"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupBrowserRoutes = setupBrowserRoutes;
// Feature: Browser | Why: Core browser proxy routes — health, plan, proxy GET
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const proxy_config_1 = require("./proxy-config");
const proxy_scanner_1 = require("./proxy-scanner");
const proxy_asset_1 = require("./proxy-asset");
const proxy_page_handler_1 = require("./proxy-page-handler");
const proxy_html_service_1 = require("./proxy-html.service");
const llm_mission_planner_1 = require("./features/llm/llm-mission-planner");
const deep_research_agent_1 = require("./features/deep-research/deep-research-agent");
const proxy_routes_action_1 = require("./proxy-routes-action");
const proxy_routes_agent_1 = require("./proxy-routes-agent");
const proxy_routes_nav_1 = require("./proxy-routes-nav");
const proxy_routes_type_1 = require("./proxy-routes-type");
const proxy_routes_cdp_1 = require("./proxy-routes-cdp");
const proxy_routes_mouse_1 = require("./proxy-routes-mouse");
const proxy_routes_external_1 = require("./proxy-routes-external");
// In-memory registry of running deep-research agents (keyed by taskId)
const activeResearchAgents = new Map();
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
    // --- browser-use/web-ui: deep research agent routes ---
    /**
     * POST /agent/deep-research/start
     * Body: { topic: string, taskId?: string, maxParallelSearches?: number }
     * Starts an async deep-research run (Plan→Execute→Synthesize).
     * Returns immediately with { taskId, outputDir } so the client can poll for the report.
     */
    app.post('/agent/deep-research/start', (req, res) => {
        const { topic, taskId, maxParallelSearches = 3 } = req.body;
        if (!topic) {
            res.status(400).json({ error: 'topic required' });
            return;
        }
        const id = taskId || `dr_${Date.now()}`;
        const outputDir = path.join(process.cwd(), '.research', id);
        const agent = new deep_research_agent_1.DeepResearchAgent(maxParallelSearches);
        activeResearchAgents.set(id, agent);
        // Fire-and-forget — client polls /status or /report
        agent.run(topic, id, outputDir)
            .then((result) => {
            console.log(`[DeepResearch] Task ${id} finished with status: ${result.status}`);
            activeResearchAgents.delete(id);
        })
            .catch((e) => {
            console.error(`[DeepResearch] Task ${id} threw:`, e.message);
            activeResearchAgents.delete(id);
        });
        res.json({ taskId: id, outputDir, message: 'Deep research started' });
    });
    /**
     * POST /agent/deep-research/:taskId/stop
     * Signals the running agent to stop after the current task.
     */
    app.post('/agent/deep-research/:taskId/stop', (req, res) => {
        const agent = activeResearchAgents.get(req.params.taskId);
        if (!agent) {
            res.status(404).json({ error: 'Task not found or already finished' });
            return;
        }
        agent.stop();
        res.json({ message: 'Stop signal sent' });
    });
    /**
     * GET /agent/deep-research/:taskId/report
     * Returns the final_report.md contents when available.
     */
    app.get('/agent/deep-research/:taskId/report', (req, res) => {
        const reportPath = path.join(process.cwd(), '.research', req.params.taskId, 'final_report.md');
        if (!fs.existsSync(reportPath)) {
            const running = activeResearchAgents.has(req.params.taskId);
            res.status(running ? 202 : 404).json({ message: running ? 'Still running' : 'Report not found' });
            return;
        }
        res.type('text/markdown').send(fs.readFileSync(reportPath, 'utf-8'));
    });
    /**
     * GET /agent/deep-research/:taskId/plan
     * Returns the current research_plan.md (useful for progress display).
     */
    app.get('/agent/deep-research/:taskId/plan', (req, res) => {
        const planPath = path.join(process.cwd(), '.research', req.params.taskId, 'research_plan.md');
        if (!fs.existsSync(planPath)) {
            res.status(404).json({ error: 'Plan not found' });
            return;
        }
        res.type('text/markdown').send(fs.readFileSync(planPath, 'utf-8'));
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
            // Why: domcontentloaded fires before JS runs — wait for networkidle so React/Vue/Angular
            // SPAs finish their initial render before we serialize the DOM. 15s cap prevents
            // pages with persistent polling (ads, websockets) from hanging forever.
            await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => { });
            // Extra SPA guard: ensure root component has mounted at least one child element
            await page.waitForFunction(() => document.body && document.body.children.length > 0, { timeout: 5000 }).catch(() => { });
            await page.evaluate(() => {
                let id = 1;
                document.querySelectorAll('button, a, input, select, textarea, [role="button"]').forEach(el => {
                    const r = el.getBoundingClientRect(), s = window.getComputedStyle(el);
                    if (r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.opacity !== '0' && s.display !== 'none')
                        el.setAttribute('data-ai-id', (id++).toString());
                });
            });
            let html = await page.content();
            // Why: derive proxy base from the actual request host so links always point back to the
            // correct origin — works on Cloud Run, custom domains, and local dev without hardcoding.
            const proxyBase = process.env.PUBLIC_PROXY_URL || `${req.protocol}://${req.get('host')}`;
            (0, proxy_config_1.stripSecurityHeaders)(res);
            res.set('Content-Type', 'text/html').status(200).send((0, proxy_scanner_1.injectScanner)((0, proxy_html_service_1.rewriteHtml)(html, targetUrl, tabId, proxyBase)));
        }
        catch (e) {
            res.status(500).send(`Proxy failed: ${e.message}`);
        }
    });
    // Delegate action + screenshot routes to extracted module
    (0, proxy_routes_agent_1.setupAgentAnalyzeRoute)(app);
    (0, proxy_routes_nav_1.setupNavRoute)(app);
    (0, proxy_routes_type_1.setupKeyTypeRoute)(app);
    (0, proxy_routes_action_1.setupActionRoute)(app);
    (0, proxy_routes_action_1.setupCoordClickRoute)(app);
    (0, proxy_routes_action_1.setupScreenshotRoute)(app);
    (0, proxy_routes_action_1.setupDomMapRoute)(app);
    (0, proxy_routes_action_1.setupScreenshotStreamRoute)(app);
    (0, proxy_routes_mouse_1.setupMouseRoutes)(app);
    (0, proxy_routes_cdp_1.setupCdpRoutes)(app);
    (0, proxy_routes_external_1.setupExternalRoutes)(app);
}
//# sourceMappingURL=proxy-routes-browser.js.map
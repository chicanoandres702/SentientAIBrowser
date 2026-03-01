// Feature: Browser | Why: Core browser proxy routes — health, plan, proxy GET
import * as path from 'path';
import * as fs from 'fs';
import { stripSecurityHeaders } from './proxy-config';
import { injectScanner } from './proxy-scanner';
import { isStaticAsset, setupAssetRoute } from './proxy-asset';
import { getPersistentPage, activePages } from './proxy-page-handler';
import { rewriteHtml } from './proxy-html.service';
import { generateLLMPlanResponse } from './features/llm/llm-mission-planner';
import { DeepResearchAgent, RunResult } from './features/deep-research/deep-research-agent';
import { Express } from 'express';
import { setupActionRoute, setupCoordClickRoute, setupDomMapRoute, setupScreenshotRoute, setupScreenshotStreamRoute } from './proxy-routes-action';
import { setupAgentAnalyzeRoute } from './proxy-routes-agent';
import { setupNavRoute } from './proxy-routes-nav';
import { setupKeyTypeRoute } from './proxy-routes-type';
import { setupCdpRoutes } from './proxy-routes-cdp';
import { setupMouseRoutes } from './proxy-routes-mouse';
import { setupExternalRoutes } from './proxy-routes-external';

// In-memory registry of running deep-research agents (keyed by taskId)
const activeResearchAgents = new Map<string, DeepResearchAgent>();

export function setupBrowserRoutes(app: Express) {
  setupAssetRoute(app);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', activeTabs: Array.from(activePages.keys()), uptime: process.uptime() });
  });

  app.post('/agent/plan', async (req, res): Promise<any> => {
    try {
      const { prompt, schemaPrompt } = req.body;
      if (!prompt) return res.status(400).json({ error: 'Prompt required' });
      const planResponse = await generateLLMPlanResponse(prompt, schemaPrompt);
      res.json(planResponse);
    } catch (e: any) {
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
  app.post('/agent/deep-research/start', (req, res): void => {
    const { topic, taskId, maxParallelSearches = 3 } = req.body;
    if (!topic) { res.status(400).json({ error: 'topic required' }); return; }

    const id = (taskId as string) || `dr_${Date.now()}`;
    const outputDir = path.join(process.cwd(), '.research', id);
    const agent = new DeepResearchAgent(maxParallelSearches);
    activeResearchAgents.set(id, agent);

    // Fire-and-forget — client polls /status or /report
    agent.run(topic, id, outputDir)
      .then((result: RunResult) => {
        console.log(`[DeepResearch] Task ${id} finished with status: ${result.status}`);
        activeResearchAgents.delete(id);
      })
      .catch((e: Error) => {
        console.error(`[DeepResearch] Task ${id} threw:`, e.message);
        activeResearchAgents.delete(id);
      });

    res.json({ taskId: id, outputDir, message: 'Deep research started' });
  });

  /**
   * POST /agent/deep-research/:taskId/stop
   * Signals the running agent to stop after the current task.
   */
  app.post('/agent/deep-research/:taskId/stop', (req, res): void => {
    const agent = activeResearchAgents.get(req.params.taskId);
    if (!agent) { res.status(404).json({ error: 'Task not found or already finished' }); return; }
    agent.stop();
    res.json({ message: 'Stop signal sent' });
  });

  /**
   * GET /agent/deep-research/:taskId/report
   * Returns the final_report.md contents when available.
   */
  app.get('/agent/deep-research/:taskId/report', (req, res): void => {
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
  app.get('/agent/deep-research/:taskId/plan', (req, res): void => {
    const planPath = path.join(process.cwd(), '.research', req.params.taskId, 'research_plan.md');
    if (!fs.existsSync(planPath)) { res.status(404).json({ error: 'Plan not found' }); return; }
    res.type('text/markdown').send(fs.readFileSync(planPath, 'utf-8'));
  });

  app.get('/proxy', async (req, res) => {
    const { url: targetUrl, tabId = 'default' } = req.query as { url?: string; tabId?: string };
    if (!targetUrl) return res.status(400).send('URL required');
    if (isStaticAsset(targetUrl)) return res.status(302).redirect(`/proxy/asset?url=${encodeURIComponent(targetUrl)}`);
    try {
      const page = await getPersistentPage(targetUrl, tabId);
      if (!page) throw new Error('Failed to load page');
      // Why: domcontentloaded fires before JS runs — wait for networkidle so React/Vue/Angular
      // SPAs finish their initial render before we serialize the DOM. 15s cap prevents
      // pages with persistent polling (ads, websockets) from hanging forever.
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      // Extra SPA guard: ensure root component has mounted at least one child element
      await page.waitForFunction(
        () => document.body && document.body.children.length > 0,
        { timeout: 5000 }
      ).catch(() => {});
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
      stripSecurityHeaders(res);
      res.set('Content-Type', 'text/html').status(200).send(injectScanner(rewriteHtml(html, targetUrl, tabId, proxyBase)));
    } catch (e: any) { res.status(500).send(`Proxy failed: ${e.message}`); }
  });

  // Delegate action + screenshot routes to extracted module
  setupAgentAnalyzeRoute(app);
  setupNavRoute(app);
  setupKeyTypeRoute(app);
  setupActionRoute(app);
  setupCoordClickRoute(app);
  setupScreenshotRoute(app);
  setupDomMapRoute(app);
  setupScreenshotStreamRoute(app);
  setupMouseRoutes(app);
  setupCdpRoutes(app);
  setupExternalRoutes(app);
}

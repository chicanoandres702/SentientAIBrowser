// Feature: Browser | Why: Core browser proxy routes — health, plan, proxy GET
import { stripSecurityHeaders } from './proxy-config';
import { injectScanner } from './proxy-scanner';
import { isStaticAsset, setupAssetRoute } from './proxy-asset';
import { getPersistentPage, activePages } from './proxy-page-handler';
import { rewriteHtml } from './proxy-html.service';
import { generateLLMPlanResponse } from './features/llm/llm-mission-planner';
import { Express } from 'express';
import { setupActionRoute, setupScreenshotRoute } from './proxy-routes-action';

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

  app.get('/proxy', async (req, res) => {
    const { url: targetUrl, tabId = 'default' } = req.query as { url?: string; tabId?: string };
    if (!targetUrl) return res.status(400).send('URL required');
    if (isStaticAsset(targetUrl)) return res.status(302).redirect(`/proxy/asset?url=${encodeURIComponent(targetUrl)}`);
    try {
      const page = await getPersistentPage(targetUrl, tabId);
      if (!page) throw new Error('Failed to load page');
      await page.waitForSelector('body', { timeout: 5000 }).catch(() => {});
      await page.evaluate(() => {
        let id = 1;
        document.querySelectorAll('button, a, input, select, textarea, [role="button"]').forEach(el => {
          const r = el.getBoundingClientRect(), s = window.getComputedStyle(el);
          if (r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.opacity !== '0' && s.display !== 'none')
            el.setAttribute('data-ai-id', (id++).toString());
        });
      });
      let html = await page.content();
      stripSecurityHeaders(res);
      res.set('Content-Type', 'text/html').status(200).send(injectScanner(rewriteHtml(html, targetUrl, tabId)));
    } catch (e: any) { res.status(500).send(`Proxy failed: ${e.message}`); }
  });

  // Delegate action + screenshot routes to extracted module
  setupActionRoute(app);
  setupScreenshotRoute(app);
}

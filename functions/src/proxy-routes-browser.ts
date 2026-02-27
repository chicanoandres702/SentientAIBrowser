// Feature: Browser | Trace: proxy-server.js
import { stripSecurityHeaders, PORT } from './proxy-config';
import { injectScanner } from './proxy-scanner';
import { isStaticAsset, setupAssetRoute } from './proxy-asset';
import { getPersistentPage, closePage, activePages } from './proxy-page-handler';
import { rewriteHtml } from './proxy-html.service';
import { Express } from 'express';

export function setupBrowserRoutes(app: Express) {
  setupAssetRoute(app);
  app.get('/proxy', async (req, res) => {
    const { url: targetUrl, tabId = 'default' } = req.query as { url?: string, tabId?: string };
    if (!targetUrl) return res.status(400).send('URL required');
    if (isStaticAsset(targetUrl)) return res.status(302).redirect(`/proxy/asset?url=${encodeURIComponent(targetUrl)}`);
    try {
      const page = await getPersistentPage(targetUrl, tabId);
      if (!page) throw new Error('Failed to load page');
      await page.waitForSelector('body', { timeout: 5000 }).catch(() => {});
      await page.evaluate(() => {
        let id = 1; document.querySelectorAll('button, a, input, select, textarea, [role="button"]').forEach(el => {
          const r = el.getBoundingClientRect(), s = window.getComputedStyle(el);
          if (r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.opacity !== '0' && s.display !== 'none') el.setAttribute('data-ai-id', (id++).toString());
        });
      });
      let html = await page.content(); stripSecurityHeaders(res);
      res.set('Content-Type', 'text/html').status(200).send(injectScanner(rewriteHtml(html, targetUrl, tabId)));
    } catch (e: any) { res.status(500).send(`Proxy failed: ${e.message}`); }
  });
  app.post('/proxy/action', async (req, res) => {
    const { url, action, id, value, tabId = 'default' } = req.body;
    let page = activePages.get(tabId) || await getPersistentPage(url, tabId).catch(() => null);
    if (!page) return res.status(500).json({ error: 'Session died' });
    try {
      const sel = `[data-ai-id="${id}"]`;
      if (action === 'click') await page.evaluate((s) => { const e = document.querySelector(s) as HTMLElement; if (e) { e.scrollIntoView({ block: 'center' }); e.click(); } }, sel);
      else if (action === 'type') {
        const el = await page.$(sel); if (!el) throw new Error('Not found'); await el.focus();
        await page.evaluate((s) => { (document.querySelector(s) as HTMLInputElement).value = ''; }, sel); await el.type(value || '', { delay: 10 });
        await page.evaluate(s => { const e = document.querySelector(s); ['input', 'change'].forEach(t => e?.dispatchEvent(new Event(t, { bubbles: true }))); }, sel);
        if (value?.length) await page.keyboard.press('Enter');
      }
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.get('/screenshot', async (req, res) => {
    try {
      const page = await getPersistentPage(req.query.url as string, (req.query.tabId as string) || 'default');
      if (!page) throw new Error('No active page');
      res.json({ screenshot: `data:image/png;base64,${await page.screenshot({ encoding: 'base64' })}` });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
}

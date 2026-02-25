// Feature: System Utilities | Trace: README.md
const { URL } = require('url');
const { getBrowser, stripSecurityHeaders, PORT } = require('./proxy-config');
const { injectScanner } = require('./proxy-scanner');
const { isStaticAsset, setupAssetRoute } = require('./proxy-asset');

// Map to hold persistent browser sessions by tabId
const activePages = new Map();

async function getPersistentPage(targetUrl, tabId) {
  const browser = await getBrowser();
  let page = activePages.get(tabId);
  if (!page) { page = await browser.newPage(); activePages.set(tabId, page); }
  const currentUrl = page.url();
  if (currentUrl === 'about:blank' || (!currentUrl.includes(targetUrl) && !targetUrl.includes(currentUrl))) {
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  }
  return page;
}

function rewriteHtml(html, targetUrl, tabId) {
  // Why: Inject <base href> so all relative URLs (scripts, images, styles) resolve
  // to the origin domain, not localhost:3000. This is the canonical fix for HTML proxying.
  const origin = new URL(targetUrl).origin;
  html = html.replace(/(<head\b[^>]*>)/i, `$1<base href="${origin}/">`);

  // Why: Only rewrite <a href> anchor tags for navigation — let everything else
  // load from origin with the correct MIME type via the base tag.
  const linkTags = [];
  html = html.replace(/<link[^>]*>/gi, (m) => { linkTags.push(m); return `<!--LINK_${linkTags.length - 1}-->`; });
  html = html.replace(/(<a\b[^>]*)\bhref=["']([^"']+)["']/gi, (match, prefix, url) => {
    if (/^(data:|mailto:|tel:|#|javascript:)/.test(url)) return match;
    try {
      const abs = new URL(url, targetUrl).href;
      if (!abs.startsWith('http')) return match;
      return `${prefix}href="http://localhost:${PORT}/proxy?tabId=${tabId}&url=${encodeURIComponent(abs)}"`;
    } catch { return match; }
  });
  return html.replace(/<!--LINK_(\d+)-->/g, (_, i) => linkTags[parseInt(i)]);
}

function setupBrowserRoutes(app) {
  setupAssetRoute(app);

  app.get('/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    const tabId = req.query.tabId || 'default';
    if (!targetUrl) return res.status(400).send('URL parameter required');
    // Why: static assets (CSS, JS, fonts) go through the passthrough to keep MIME types correct
    if (isStaticAsset(targetUrl)) return res.redirect(`/proxy/asset?url=${encodeURIComponent(targetUrl)}`);

    try {
      const page = await getPersistentPage(targetUrl, tabId);
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
      html = rewriteHtml(html, targetUrl, tabId);
      res.set('Content-Type', 'text/html').status(200).send(injectScanner(html));
    } catch (error) { res.status(500).send(`Proxy failed: ${error.message}`); }
  });

  app.post('/proxy/action', async (req, res) => {
    const { url, action, id, value, tabId } = req.body;
    const tId = tabId || 'default';
    let page = activePages.get(tId);
    if (!page) {
      if (!url) return res.status(400).json({ error: 'Session died and URL required' });
      try { page = await getPersistentPage(url, tId); } catch { return res.status(500).json({ error: 'Failed to recover session' }); }
    }
    try {
      const sel = `[data-ai-id="${id}"]`;
      if (action === 'click') {
        await page.evaluate((s) => { const e = document.querySelector(s); if (e) { e.scrollIntoView({ block: 'center' }); e.click(); } }, sel);
      } else if (action === 'type') {
        const el = await page.$(sel);
        if (!el) throw new Error('Element not found');
        await el.focus();
        await page.evaluate((s) => { document.querySelector(s).value = ''; }, sel);
        await el.type(value || '', { delay: 10 });
        await page.evaluate((s) => { const e = document.querySelector(s); e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, sel);
        if (value?.length) await page.keyboard.press('Enter');
      }
      res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
  });

  app.get('/screenshot', async (req, res) => {
    const { url, tabId } = req.query;
    if (!url) return res.status(400).send('URL parameter required');
    try {
      const page = await getPersistentPage(url, tabId || 'default');
      const screenshot = await page.screenshot({ encoding: 'base64' });
      res.json({ screenshot: `data:image/png;base64,${screenshot}` });
    } catch (error) { res.status(500).json({ error: error.message }); }
  });
  app.all('/proxy/forward', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('URL parameter required');

    try {
      const fetch = (await import('node-fetch')).default;
      const headers = { ...req.headers };
      delete headers.host;
      delete headers.referer;
      delete headers.origin;

      const init = {
        method: req.method,
        headers,
      };

      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        // Only attach body if we actually have one from the client
        if (req.body && Object.keys(req.body).length > 0) {
            init.body = typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;
        }
      }

      const response = await fetch(targetUrl, init);
      res.status(response.status);
      
      const resHeaders = {};
      for (const [key, value] of response.headers.entries()) {
        resHeaders[key] = value;
      }
      delete resHeaders['access-control-allow-origin'];
      res.set(resHeaders);
      res.set('Access-Control-Allow-Origin', '*');
      
      response.body.pipe(res);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
}

module.exports = { setupBrowserRoutes };

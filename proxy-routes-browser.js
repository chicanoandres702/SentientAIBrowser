// Feature: System Utilities | Trace: README.md
const { URL } = require('url');
const { getBrowser, stripSecurityHeaders, PORT } = require('./proxy-config');
const { injectScanner } = require('./proxy-scanner');

function setupBrowserRoutes(app) {
  app.get('/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('URL parameter required');

    try {
      const browser = await getBrowser();
      const page = await browser.newPage();
      await page.setExtraHTTPHeaders({ 'Accept-Language': req.headers['accept-language'] || 'en-US,en;q=0.9' });
      await page.setViewport({ width: 1280, height: 800 });

      const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const contentType = response?.headers()['content-type'] || '';

      if (contentType.includes('text/html')) {
        let html = await page.content();
        stripSecurityHeaders(res);
        html = html.replace(/(href|src|action)=["']([^"']+)["']/gi, (match, attr, url) => {
          if (url.startsWith('data:') || url.startsWith('mailto:') || url.startsWith('tel:')) return match;
          try {
            const absoluteUrl = new URL(url, targetUrl).href;
            if (!absoluteUrl.startsWith('http')) return match;
            return \`\${attr}="http://localhost:\${PORT}/proxy?url=\${encodeURIComponent(absoluteUrl)}"\`;
          } catch (e) { return match; }
        });
        res.set('Content-Type', 'text/html').status(response?.status() || 200).send(injectScanner(html));
      } else {
        res.set('Content-Type', contentType).status(response?.status() || 200).send(await response.buffer());
      }
      await page.close();
    } catch (error) { res.status(500).send(\`Proxy failed: \${error.message}\`); }
  });

  app.post('/proxy/action', async (req, res) => {
    const { url, action, id, value } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });
    try {
      const browser = await getBrowser();
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2' });
      const selector = \`[data-ai-id="\${id}"]\`;
      if (action === 'click') await page.click(selector);
      else if (action === 'type') await page.type(selector, value || '');
      await page.close();
      res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
  });

  app.get('/screenshot', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('URL parameter required');
    try {
      const browser = await getBrowser();
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      const screenshot = await page.screenshot({ encoding: 'base64' });
      await page.close();
      res.json({ screenshot: \`data:image/png;base64,\${screenshot}\` });
    } catch (error) { res.status(500).json({ error: error.message }); }
  });
}

module.exports = { setupBrowserRoutes };

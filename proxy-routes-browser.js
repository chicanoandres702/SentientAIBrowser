// Feature: System Utilities | Trace: README.md
const { URL } = require('url');
const { getBrowser, stripSecurityHeaders, PORT } = require('./proxy-config');
const { injectScanner } = require('./proxy-scanner');

const { Worker } = require('worker_threads');
const path = require('path');

function setupBrowserRoutes(app) {
  app.get('/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('URL parameter required');

    console.log(`[Worker ${process.pid}] Offloading SCRAPE task for: ${targetUrl}`);
    
    const worker = new Worker(path.join(__dirname, 'scripts', 'proxy.worker.js'), {
        workerData: { type: 'SCRAPE', payload: { url: targetUrl } }
    });

    worker.on('message', (response) => {
        if (response.success) {
            stripSecurityHeaders(res);
            let html = response.result.data;
            html = html.replace(/(href|src|action)=["']([^"']+)["']/gi, (match, attr, url) => {
                try {
                    const absoluteUrl = new URL(url, targetUrl).href;
                    if (!absoluteUrl.startsWith('http')) return match;
                    return `${attr}="http://localhost:${PORT}/proxy?url=${encodeURIComponent(absoluteUrl)}"`;
                } catch (e) { return match; }
            });
            res.set('Content-Type', 'text/html').status(200).send(injectScanner(html));
        } else {
            res.status(500).send(`Worker failed: ${response.error}`);
        }
    });

    worker.on('error', (err) => res.status(500).send(`Worker Error: ${err.message}`));
  });

  app.post('/proxy/action', async (req, res) => {
    const { url, action, id, value } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });

    console.log(`[Worker ${process.pid}] Offloading ACTION task: ${action} on ${url}`);

    const worker = new Worker(path.join(__dirname, 'scripts', 'proxy.worker.js'), {
        workerData: { type: 'ACTION', payload: { url, action, id, value } }
    });

    worker.on('message', (response) => {
        if (response.success) res.json({ success: true });
        else res.status(500).json({ error: response.error });
    });
    worker.on('error', (err) => res.status(500).json({ error: err.message }));
  });

  app.get('/screenshot', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('URL parameter required');

    console.log(`[Worker ${process.pid}] Offloading SCREENSHOT task for: ${targetUrl}`);

    const worker = new Worker(path.join(__dirname, 'scripts', 'proxy.worker.js'), {
        workerData: { type: 'SCREENSHOT', payload: { url: targetUrl } }
    });

    worker.on('message', (response) => {
        if (response.success) res.json({ screenshot: response.result.screenshot });
        else res.status(500).json({ error: response.error });
    });
    worker.on('error', (err) => res.status(500).json({ error: err.message }));
  });
}

module.exports = { setupBrowserRoutes };

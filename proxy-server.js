const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { URL } = require('url');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const app = express();
const PORT = 3000;
const TASKS_FILE = path.join(__dirname, 'tasks.json');

app.use(cors());
app.use(express.json());

// Tasks endpoint for manual polling or watcher sync
app.get('/proxy/tasks', (req, res) => {
  if (!fs.existsSync(TASKS_FILE)) return res.json([]);
  try {
    const data = fs.readFileSync(TASKS_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (e) {
    res.status(500).json({ error: 'Failed to read tasks' });
  }
});

app.post('/proxy/tasks', (req, res) => {
  try {
    fs.writeFileSync(TASKS_FILE, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to write tasks' });
  }
});

app.post('/git/commit', (req, res) => {
  const { message } = req.body;
  const commitMsg = message || "AI: Autonomous Sync Update";
  
  console.log(`[Sentient Git] Committing with message: ${commitMsg}`);
  
  const command = `git add . && git commit -m "${commitMsg.replace(/"/g, '\\"')}" && git push`;
  
  exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      console.error(`[Sentient Git] Error: ${error.message}`);
      return res.status(500).json({ error: error.message, details: stderr });
    }
    console.log(`[Sentient Git] Success: ${stdout}`);
    res.json({ success: true, output: stdout });
  });
});

// The AI DOM scanner script injected into every HTML page
const SCANNER_SCRIPT = getScannerScript();

let browserInstance = null;

async function getBrowser() {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }
  return browserInstance;
}

app.get('/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('URL parameter required');

  console.log(`[Sentient Proxy] Fetching: ${targetUrl}`);

  try {
    const browser = await getBrowser();
    const page = await browser.newPage();

    // Pass through common headers to help with session/auth if needed
    await page.setExtraHTTPHeaders({
      'Accept-Language': req.headers['accept-language'] || 'en-US,en;q=0.9',
    });

    await page.setViewport({ width: 1280, height: 800 });

    const response = await page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    const contentType = response?.headers()['content-type'] || '';

    if (contentType.includes('text/html')) {
      let html = await page.content();

      // 1. Strip security headers that prevent iframe loading
      stripSecurityHeaders(res);

      // 2. Rewrite URLs to route THROUGH THIS PROXY
      html = html.replace(/(href|src|action)=["']([^"']+)["']/gi, (match, attr, url) => {
        if (url.startsWith('data:') || url.startsWith('mailto:') || url.startsWith('tel:')) return match;

        try {
          const absoluteUrl = new URL(url, targetUrl).href;
          if (!absoluteUrl.startsWith('http')) return match;
          return `${attr}="http://localhost:${PORT}/proxy?url=${encodeURIComponent(absoluteUrl)}"`;
        } catch (e) {
          return match;
        }
      });

      // 3. Inject the Sentient Automation Scanner
      html = injectScanner(html);

      res.set('Content-Type', 'text/html');
      res.status(response?.status() || 200).send(html);
    } else {
      const buffer = await response.buffer();
      res.set('Content-Type', contentType);
      res.status(response?.status() || 200).send(buffer);
    }

    await page.close();
  } catch (error) {
    console.error('Proxy Error:', error.message);
    res.status(500).send(`Proxy failed: ${error.message}`);
  }
});

// Endpoint to execute a Puppeteer action directly on the server if postMessage fails
app.post('/proxy/action', async (req, res) => {
  const { url, action, id, value } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });

  console.log(`[Sentient Proxy] Action: ${action} on ${id} at ${url}`);

  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    const selector = `[data-ai-id="${id}"]`;
    if (action === 'click') {
      await page.click(selector);
    } else if (action === 'type') {
      await page.type(selector, value || '');
    }

    await page.close();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/screenshot', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('URL parameter required');

  console.log(`[Sentient Proxy] Screenshotting: ${targetUrl}`);

  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    const screenshot = await page.screenshot({ encoding: 'base64' });
    await page.close();

    res.json({ screenshot: `data:image/png;base64,${screenshot}` });
  } catch (error) {
    console.error('Screenshot Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Sentient Proxy running at http://localhost:${PORT}`);
});

// --- Helper Functions ---

function stripSecurityHeaders(res) {
  res.removeHeader('X-Frame-Options');
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('Content-Security-Policy-Report-Only');
  res.removeHeader('X-Content-Type-Options');
}

function injectScanner(html) {
  if (html.includes('</body>')) {
    return html.replace('</body>', SCANNER_SCRIPT + '</body>');
  }
  return html + SCANNER_SCRIPT;
}

function getScannerScript() {
  return `
<script>
(function() {
  var elementMap = [];
  var currentId = 1;

  function isVisible(el) {
    if (!el || el.nodeType !== 1) return false;
    var rect = el.getBoundingClientRect();
    var style = window.getComputedStyle(el);
    return (
      rect.width > 0 && rect.height > 0 &&
      style.visibility !== 'hidden' &&
      style.display !== 'none' &&
      style.opacity !== '0'
    );
  }

  function scanDOM() {
    elementMap = [];
    currentId = 1;
    var els = document.querySelectorAll(
      'button, a, input, select, textarea, [role="button"]'
    );
    els.forEach(function(el) {
      if (isVisible(el)) {
        el.setAttribute('data-ai-id', currentId.toString());
        var text = el.innerText || el.placeholder || el.value
          || el.getAttribute('aria-label') || el.name || '';
        text = text.trim();
        if (text || el.tagName === 'INPUT') {
          elementMap.push({
            id: currentId,
            tag: el.tagName.toLowerCase(),
            type: el.type || undefined,
            text: text.substring(0, 50)
          });
          currentId++;
        }
      }
    });
    window.parent.postMessage({
      source: 'sentient-scanner',
      type: 'DOM_MAP',
      url: window.location.href,
      payload: elementMap
    }, '*');
  }

  function executeAction(action, targetId, value) {
    var el = document.querySelector('[data-ai-id="' + targetId + '"]');
    if (!el) {
      window.parent.postMessage({ source: 'sentient-scanner', type: 'ERROR', payload: 'Element not found' }, '*');
      return;
    }
    if (action === 'click') {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.click();
      window.parent.postMessage({ source: 'sentient-scanner', type: 'SUCCESS', payload: 'Clicked ' + targetId }, '*');
    } else if (action === 'type') {
      el.value = value || '';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      window.parent.postMessage({ source: 'sentient-scanner', type: 'SUCCESS', payload: 'Typed ' + targetId }, '*');
    }
    setTimeout(scanDOM, 500);
  }

  window.addEventListener('message', function(event) {
    if (!event.data || event.data.source !== 'sentient-parent') return;
    if (event.data.type === 'SCAN') scanDOM();
    if (event.data.type === 'ACTION') {
      executeAction(event.data.action, event.data.id, event.data.value);
    }
  });

  var observer = new MutationObserver(function() {
    if (window._scanTimeout) clearTimeout(window._scanTimeout);
    window._scanTimeout = setTimeout(function() {
      scanDOM();
    }, 1500);
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }

  window._runAIScan = scanDOM;
  setTimeout(scanDOM, 2000);
})();
</script>`;
}

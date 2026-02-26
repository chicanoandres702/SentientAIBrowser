// Feature: System Utilities | Trace: README.md
const { URL } = require('url');

/**
 * Determines if a URL points to a static asset based on common extensions.
 */
function isStaticAsset(url) {
  try {
    const pathname = new URL(url).pathname;
    const ext = pathname.split('.').pop().toLowerCase();
    const staticExts = ['js', 'css', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf', 'otf', 'map', 'json'];
    return staticExts.includes(ext);
  } catch {
    return false;
  }
}

/**
 * Sets up the asset passthrough route to handle MIME types correctly.
 */
function setupAssetRoute(app) {
  app.get('/proxy/asset', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('Asset URL required');

    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(targetUrl, {
        headers: { 
          'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
          'Accept': req.headers['accept'] || '*/*'
        }
      });

      const contentType = response.headers.get('content-type');
      if (contentType) res.set('Content-Type', contentType);
      
      const cacheControl = response.headers.get('cache-control');
      if (cacheControl) res.set('Cache-Control', cacheControl);

      response.body.pipe(res);
    } catch (error) {
      console.error(`[Sentient Proxy] Asset fetch failure for ${targetUrl}:`, error.message);
      res.status(500).send(`Asset failure: ${error.message}`);
    }
  });
}

module.exports = { isStaticAsset, setupAssetRoute };

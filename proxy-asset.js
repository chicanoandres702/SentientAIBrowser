// Feature: System Utilities | Trace: proxy-routes-browser.js

const STATIC_ASSET_EXTENSIONS = [
    '.css', '.js', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp',
    '.woff', '.woff2', '.ttf', '.eot', '.ico', '.map'
];

/**
 * Checks if a given URL points to a static asset based on its file extension.
 * @param {string} url The URL to check.
 * @returns {boolean} True if the URL is for a static asset.
 */
function isStaticAsset(url) {
    try {
        const path = new URL(url).pathname;
        return STATIC_ASSET_EXTENSIONS.some(ext => path.endsWith(ext));
    } catch {
        return false;
    }
}

/**
 * Sets up a passthrough route for static assets. This prevents them from being
 * processed by the main HTML proxy, preserving their content type and caching behavior.
 * @param {import('express').Application} app The Express application instance.
 */
function setupAssetRoute(app) {
    app.get('/proxy/asset', async (req, res) => {
        const targetUrl = req.query.url;
        if (!targetUrl) {
            return res.status(400).send('URL parameter required for asset proxy.');
        }

        try {
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(targetUrl, { headers: { 'User-Agent': req.headers['user-agent'] || '' } });

            // Forward headers from the target response to the client
            response.headers.forEach((value, name) => {
                res.setHeader(name, value);
            });

            response.body.pipe(res);
        } catch (error) {
            res.status(500).send(`Failed to fetch asset: ${error.message}`);
        }
    });
}

module.exports = { isStaticAsset, setupAssetRoute };
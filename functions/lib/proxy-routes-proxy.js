"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupProxyRoute = setupProxyRoute;
const proxy_page_handler_1 = require("./proxy-page-handler");
const proxy_route_utils_1 = require("./proxy-route.utils");
/**
 * GET /proxy?url=...&tabId=...
 * Why: The frontend builds `${PROXY_BASE_URL}/proxy?url=...&tabId=...` as the iframe/webview
 * src (see sentient-browser.utils.ts). Previously a full HTML-relay was in place. Now Playwright
 * handles rendering; this stub:
 *   1. Fires an async Playwright navigation so the cloud session stays in sync.
 *   2. Redirects the caller directly to the real URL, stopping the 404 cascade.
 */
function setupProxyRoute(app) {
    app.get('/proxy', async (req, res) => {
        (0, proxy_route_utils_1.applyCorsHeaders)(res);
        const { url, tabId = 'default' } = req.query;
        if (!url)
            return res.status(400).json({ error: 'url required' });
        // Fire-and-forget: keep Playwright session in sync with what the webview is loading
        (0, proxy_page_handler_1.getPersistentPage)(url, tabId).catch(() => { });
        // Redirect webview to the real URL — stops 404 and the consequent 429 retry storm
        return res.redirect(302, url);
    });
}
//# sourceMappingURL=proxy-routes-proxy.js.map
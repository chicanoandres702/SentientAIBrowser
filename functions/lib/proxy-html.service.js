"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rewriteHtml = rewriteHtml;
// Feature: Browser | Trace: proxy-routes-browser.js
const url_1 = require("url");
/**
 * Rewrites <a href> links so they route back through the proxy.
 * @param proxyBase  Public proxy origin — e.g. https://sentient-proxy-....run.app
 *                   Derive from req: process.env.PUBLIC_PROXY_URL || `${req.protocol}://${req.get('host')}`
 */
function rewriteHtml(html, targetUrl, tabId, proxyBase) {
    const origin = new url_1.URL(targetUrl).origin;
    html = html.replace(/(<head\b[^>]*>)/i, `$1<base href="${origin}/">`);
    const linkTags = [];
    html = html.replace(/<link[^>]*>/gi, (m) => { linkTags.push(m); return `<!--LINK_${linkTags.length - 1}-->`; });
    html = html.replace(/(<a\b[^>]*)\bhref=["']([^"']+)["']/gi, (match, prefix, url) => {
        if (/^(data:|mailto:|tel:|#|javascript:)/.test(url))
            return match;
        try {
            const abs = new url_1.URL(url, targetUrl).href;
            if (!abs.startsWith('http'))
                return match;
            return `${prefix}href="${proxyBase}/proxy?tabId=${tabId}&url=${encodeURIComponent(abs)}"`;
        }
        catch (_a) {
            return match;
        }
    });
    return html.replace(/<!--LINK_(\d+)-->/g, (_, i) => linkTags[parseInt(i)]);
}
//# sourceMappingURL=proxy-html.service.js.map
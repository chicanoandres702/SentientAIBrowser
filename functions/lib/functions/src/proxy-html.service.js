"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rewriteHtml = rewriteHtml;
// Feature: Browser | Trace: proxy-routes-browser.js
const url_1 = require("url");
const proxy_config_1 = require("./proxy-config");
function rewriteHtml(html, targetUrl, tabId) {
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
            return `${prefix}href="http://localhost:${proxy_config_1.PORT}/proxy?tabId=${tabId}&url=${encodeURIComponent(abs)}"`;
        }
        catch (_a) {
            return match;
        }
    });
    return html.replace(/<!--LINK_(\d+)-->/g, (_, i) => linkTags[parseInt(i)]);
}
//# sourceMappingURL=proxy-html.service.js.map
// Feature: Browser | Trace: proxy-routes-browser.js
import { URL } from 'url';

/**
 * Rewrites <a href> links so they route back through the proxy.
 * @param proxyBase  Public proxy origin — e.g. https://sentient-proxy-....run.app
 *                   Derive from req: process.env.PUBLIC_PROXY_URL || `${req.protocol}://${req.get('host')}`
 */
export function rewriteHtml(
  html: string,
  targetUrl: string,
  tabId: string,
  proxyBase: string,
): string {
  const origin = new URL(targetUrl).origin;
  html = html.replace(/(<head\b[^>]*>)/i, `$1<base href="${origin}/">`);
  const linkTags: string[] = [];
  html = html.replace(/<link[^>]*>/gi, (m) => { linkTags.push(m); return `<!--LINK_${linkTags.length - 1}-->`; });
  html = html.replace(/(<a\b[^>]*)\bhref=["']([^"']+)["']/gi, (match, prefix, url) => {
    if (/^(data:|mailto:|tel:|#|javascript:)/.test(url)) return match;
    try {
      const abs = new URL(url, targetUrl).href;
      if (!abs.startsWith('http')) return match;
      return `${prefix}href="${proxyBase}/proxy?tabId=${tabId}&url=${encodeURIComponent(abs)}"`;
    } catch { return match; }
  });
  return html.replace(/<!--LINK_(\d+)-->/g, (_, i) => linkTags[parseInt(i)]);
}

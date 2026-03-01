// Feature: Browser | Trace: proxy-fetch.route.ts
import { URL } from 'url';

/**
 * Rewrite HTML for proxy delivery.
 *
 * Strategy (in order):
 *  1. Inject <base href="<origin>/"> so ALL relative URLs (assets, scripts, XHR) resolve
 *     to the real origin — no fragile regex enumeration of every src/href/action.
 *  2. Rewrite only <a href> and <form action> to route through the proxy so navigation
 *     and form submissions stay inside the proxy session.
 *  3. Preserve <link> tags (stylesheets) — they resolve via the <base> tag naturally.
 *
 * Why <base> tag for assets instead of rewriting every src=:
 *  Browser natively resolves relative URLs against <base href>. This handles JS-injected
 *  nodes, CSS url() references, and srcset — all cases a regex can miss.
 */
export function rewriteHtml(
  html: string,
  targetUrl: string,
  tabId: string,
  proxyBase: string,
): string {
  let origin: string;
  try {
    origin = new URL(targetUrl).origin;
  } catch {
    return html;
  }

  // 1. Inject <base> right after <head> — all relative URLs resolve to the real origin
  html = html.replace(/(<head\b[^>]*>)/i, `$1<base href="${origin}/">`);

  // 2. Rewrite <a href> through the proxy so clicking links stays in the proxy context
  html = html.replace(/(<a\b[^>]*)\bhref=["']([^"']+)["']/gi, (match, prefix, url) => {
    if (/^(data:|mailto:|tel:|#|javascript:)/i.test(url)) return match;
    try {
      const abs = new URL(url, targetUrl).href;
      if (!abs.startsWith('http')) return match;
      return `${prefix}href="${proxyBase}/${abs}?tabId=${encodeURIComponent(tabId)}"`;
    } catch { return match; }
  });

  // 3. Rewrite <form action> so POST submissions stay in the proxy context
  html = html.replace(/(<form\b[^>]*)\baction=["']([^"']+)["']/gi, (match, prefix, url) => {
    if (/^(javascript:)/i.test(url)) return match;
    try {
      const abs = new URL(url, targetUrl).href;
      return `${prefix}action="${proxyBase}/${abs}?tabId=${encodeURIComponent(tabId)}"`;
    } catch { return match; }
  });

  return html;
}


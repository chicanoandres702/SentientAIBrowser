// Feature: Proxy Core | Why: Universal GET+POST passthrough — everything after the leading
// slash IS the target URL. Supports relative URLs natively via <base> injection so links,
// assets, and form actions all resolve to the right origin without fragile link-rewriting.
//
// Route pattern:  /:url(*)
// Examples:
//   GET  /https://example.com/page    → proxies GET  https://example.com/page
//   POST /https://example.com/login   → replays form body as POST to that URL in Playwright
//   GET  /https://img.example.com/a.png → streams asset directly (no Playwright overhead)

import { Router, Request, Response } from 'express';
import { getPersistentPage } from './proxy-page-handler';
import { guardedNavigate } from './proxy-nav-controller';
import { rewriteHtml } from './proxy-html.service';
import { injectScanner } from './proxy-scanner';
import { isStaticAsset, proxyAsset } from './proxy-asset';
import { stripSecurityHeaders } from './proxy-config';

export const proxyRouter = Router();

// ── helpers ──────────────────────────────────────────────────────────────────

/** Extract + normalise the target URL from the wildcard path segment */
function resolveTargetUrl(rawPath: string, referer?: string): string | null {
    // The param arrives as e.g. "https://example.com/path" — strip leading slash added by Express
    const stripped = rawPath.replace(/^\/+/, '');
    // Already absolute
    if (/^https?:\/\//i.test(stripped)) return stripped;
    // Relative path — resolve against the referer's origin
    if (referer) {
        try {
            return new URL(stripped, referer).href;
        } catch { /* fall through */ }
    }
    return null;
}

/** Get proxyBase for rewriting links back through this server */
function proxyBase(req: Request): string {
    return process.env.PUBLIC_PROXY_URL || `${req.protocol}://${req.get('host')}`;
}

// ── GET /* ────────────────────────────────────────────────────────────────────
proxyRouter.get('/*', async (req: Request, res: Response): Promise<any> => {
    const rawPath = req.params[0] || '';
    const tabId = (req.query.tabId as string) || 'default';
    const referer = req.headers.referer;

    const targetUrl = resolveTargetUrl(rawPath, referer);
    if (!targetUrl) return res.status(400).send('Invalid URL — use /<full-url> e.g. /https://example.com');

    // Static assets: stream directly — no Playwright overhead
    if (isStaticAsset(targetUrl)) return proxyAsset(targetUrl, req, res);

    try {
        const page = await getPersistentPage(targetUrl, tabId);
        if (!page) throw new Error('Failed to acquire browser page');

        await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});

        const html = await page.content();
        stripSecurityHeaders(res);
        res.set('Content-Type', 'text/html; charset=utf-8')
           .status(200)
           .send(injectScanner(rewriteHtml(html, targetUrl, tabId, proxyBase(req))));
    } catch (e: any) {
        res.status(500).send(`Proxy error: ${e.message}`);
    }
});

// ── POST /* ───────────────────────────────────────────────────────────────────
// Why: Form submissions and API calls that POST data must reach the real origin.
// We navigate Playwright to the URL with a synthetic form submission so all
// cookies/session state in the persistent context are included automatically.
proxyRouter.post('/*', async (req: Request, res: Response): Promise<any> => {
    const rawPath = req.params[0] || '';
    const tabId = (req.query.tabId as string) || 'default';
    const referer = req.headers.referer;

    const targetUrl = resolveTargetUrl(rawPath, referer);
    if (!targetUrl) return res.status(400).send('Invalid URL');

    const body = req.body as Record<string, string>;

    try {
        const page = await getPersistentPage(null, tabId);
        if (!page) throw new Error('Failed to acquire browser page');

        // Why: evaluate a synthetic form POST in the page context so Playwright's
        // cookie jar is automatically attached — no manual cookie forwarding needed.
        await page.evaluate(({ url, fields }: { url: string; fields: Record<string, string> }) => {
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = url;
            Object.entries(fields).forEach(([k, v]) => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = k;
                input.value = v;
                form.appendChild(input);
            });
            document.body.appendChild(form);
            form.submit();
        }, { url: targetUrl, fields: body });

        await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
        const finalUrl = page.url();
        const html = await page.content();
        stripSecurityHeaders(res);
        res.set('Content-Type', 'text/html; charset=utf-8')
           .status(200)
           .send(injectScanner(rewriteHtml(html, finalUrl, tabId, proxyBase(req))));
    } catch (e: any) {
        res.status(500).send(`POST proxy error: ${e.message}`);
    }
});

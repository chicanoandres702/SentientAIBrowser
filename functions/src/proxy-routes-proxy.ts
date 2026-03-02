/*
 * [Parent Feature/Milestone] Browser Proxy
 * [Child Task/Issue] #fix — GET /proxy?url&tabId missing route
 * [Subtask] Navigate Playwright to url and redirect caller — stops 404/429 cascade
 * [Upstream] Frontend webview/iframe -> [Downstream] Playwright page + HTTP redirect
 * [Law Check] 30 lines | Passed 100-Line Law
 */
import { Express } from 'express';
import { getPersistentPage } from './proxy-page-handler';
import { applyCorsHeaders } from './proxy-route.utils';

/**
 * GET /proxy?url=...&tabId=...
 * Why: The frontend builds `${PROXY_BASE_URL}/proxy?url=...&tabId=...` as the iframe/webview
 * src (see sentient-browser.utils.ts). Previously a full HTML-relay was in place. Now Playwright
 * handles rendering; this stub:
 *   1. Fires an async Playwright navigation so the cloud session stays in sync.
 *   2. Redirects the caller directly to the real URL, stopping the 404 cascade.
 */
export function setupProxyRoute(app: Express): void {
    app.get('/proxy', async (req, res): Promise<any> => {
        applyCorsHeaders(res);
        const { url, tabId = 'default' } = req.query as { url?: string; tabId?: string };
        if (!url) return res.status(400).json({ error: 'url required' });

        // Fire-and-forget: keep Playwright session in sync with what the webview is loading
        getPersistentPage(url, tabId as string).catch(() => {});

        // Redirect webview to the real URL — stops 404 and the consequent 429 retry storm
        return res.redirect(302, url);
    });
}

// Feature: CDP Bridge | Why: Expose Playwright's Chrome DevTools Protocol over HTTPS so any
// browser (desktop chrome://inspect or mobile DevTools frontend) can connect to the live
// Playwright session — essential for manually solving CAPTCHAs without breaking the session.
import { Express } from 'express';
import * as http from 'http';
import { REMOTE_DEBUGGING_PORT, getBrowser } from './proxy-config';
import { applyCorsHeaders } from './proxy-route.utils';

const CDP_BASE = `http://127.0.0.1:${REMOTE_DEBUGGING_PORT}`;

/** Proxy a local CDP HTTP endpoint and return its JSON.
 *  Calls getBrowser() first so Chrome is guaranteed to be running. */
async function proxyJson(path: string): Promise<any> {
    await getBrowser(); // Ensure Chrome launched with --remote-debugging-port before querying
    return new Promise((resolve, reject) => {
        http.get(`${CDP_BASE}${path}`, (res) => {
            let body = '';
            res.on('data', (d) => body += d);
            res.on('end', () => {
                try { resolve(JSON.parse(body)); }
                catch { reject(new Error('Invalid JSON from CDP')); }
            });
        }).on('error', reject);
    });
}

/**
 * GET /cdp/info
 * Returns the CDP WebSocket URL, a DevTools-frontend link you can open in any browser,
 * and the list of live pages. The DevTools link works on desktop Chrome/Edge (paste into
 * address bar) and on any device via the hosted devtools frontend URL.
 *
 * WHY CDP MATTERS:
 *   Playwright uses CDP internally to control Chrome. Exposing port 9222 and proxying
 *   its WebSocket through the Cloud Run HTTPS endpoint means you can connect your own
 *   browser to the SAME Chromium instance Playwright is driving — letting you manually
 *   complete CAPTCHAs, MFA prompts, or any challenge without losing the session.
 *
 * ANDROID EDGE / ANY MOBILE BROWSER:
 *   Mobile browsers can't run chrome://inspect, but they CAN open the hosted DevTools
 *   frontend which is just a React app. Copy the "devtoolsFrontendUrl" from any page
 *   entry and replace the ws= param with the Cloud Run wss= URL shown in this response.
 */
export function setupCdpRoutes(app: Express): void {
    app.get('/cdp/info', async (_req, res): Promise<any> => {
        applyCorsHeaders(res);
        try {
            const [version, pages] = await Promise.all([
                proxyJson('/json/version'),
                proxyJson('/json'),
            ]);

            // Replace localhost WS endpoints with Cloud Run-routable paths
            const host = _req.headers.host || '';
            const protocol = _req.headers['x-forwarded-proto'] === 'https' ? 'wss' : 'ws';
            const mappedPages = (pages as any[]).map((p: any) => {
                const tabPath = p.webSocketDebuggerUrl?.replace(
                    `ws://127.0.0.1:${REMOTE_DEBUGGING_PORT}`,
                    `${protocol}://${host}/cdp-proxy`
                );
                // DevTools frontend URL — paste into Chrome address bar, or open on mobile
                const devtoolsUrl = tabPath
                    ? `https://chrome-devtools-frontend.appspot.com/serve_rev/@${version.webSocketDebuggerUrl?.match(/@([^/]+)/)?.[1] || 'HEAD'}/inspector.html?${protocol}=${tabPath.replace(/^wss?:\/\//, '')}`
                    : null;
                return { id: p.id, title: p.title, url: p.url, tabWsUrl: tabPath, devtoolsUrl };
            });

            res.json({
                browserVersion: version['Browser'],
                protocolVersion: version['Protocol-Version'],
                // Direct WS endpoint for the whole browser (chrome://inspect uses this)
                browserWsUrl: version.webSocketDebuggerUrl?.replace(
                    `ws://127.0.0.1:${REMOTE_DEBUGGING_PORT}`,
                    `${protocol}://${host}/cdp-proxy`
                ),
                cdpProxyPath: `/cdp-proxy`,
                pages: mappedPages,
                instructions: {
                    desktop: 'In Chrome/Edge: open chrome://inspect → Configure → add your Cloud Run host:443',
                    mobile: 'Open the devtoolsUrl from any page entry in your mobile browser',
                },
            });
        } catch (e: any) {
            res.status(503).json({ error: 'CDP not ready — browser may still be launching', detail: e.message });
        }
    });

    // Raw CDP JSON passthrough — chrome://inspect polls these
    app.get('/cdp/json', async (_req, res): Promise<any> => {
        applyCorsHeaders(res);
        try { res.json(await proxyJson('/json')); }
        catch (e: any) { res.status(503).json({ error: e.message }); }
    });

    app.get('/cdp/json/version', async (_req, res): Promise<any> => {
        applyCorsHeaders(res);
        try { res.json(await proxyJson('/json/version')); }
        catch (e: any) { res.status(503).json({ error: e.message }); }
    });
}

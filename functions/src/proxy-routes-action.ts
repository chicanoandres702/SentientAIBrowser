// Feature: Browser | Why: Route handlers for proxy action + screenshot — keeps routes file under 100 lines
import { Express } from 'express';
import { getPersistentPage, activePages, captureAndSyncTab } from './proxy-page-handler';
import { applyCorsHeaders, resolvePage } from './proxy-route.utils';
import { buildDomMap } from './proxy-dom-map';

/** POST /proxy/action — execute click/type on a persistent page */
export function setupActionRoute(app: Express) {
    app.post('/proxy/action', async (req, res): Promise<any> => {
        applyCorsHeaders(res);
        const { url, action, id, value, tabId = 'default', role, name: ariaName, text: ariaText } = req.body;
        let page = activePages.get(tabId) || await getPersistentPage(url, tabId).catch(() => null);
        if (!page) return res.status(500).json({ error: 'Session died' });
        try {
            // Why: ARIA selectors (role+name) are preferred — Playwright MCP style, stable across DOM mutations.
            // data-ai-id is the legacy fallback for HeadlessWebView sessions.
            const resolveLocator = () => {
                if (role) return page!.getByRole(role as any, ariaName ? { name: ariaName, exact: false } : undefined);
                if (ariaName) return page!.getByLabel(ariaName, { exact: false });
                if (ariaText) return page!.getByText(ariaText, { exact: false });
                if (id) return page!.locator(`[data-ai-id="${id}"]`);
                throw new Error('No element selector provided (need role, name, text, or id)');
            };
            const locator = resolveLocator();
            if (action === 'click') {
                await locator.first().scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
                await locator.first().click({ timeout: 8000 });
            } else if (action === 'type') {
                await locator.first().click({ timeout: 5000 });
                await locator.first().fill(value || '');
                if (value?.length) await page.keyboard.press('Enter');
            }
            await page.waitForLoadState('domcontentloaded', { timeout: 2000 }).catch(() => {});
            await captureAndSyncTab(tabId);
            res.json({ success: true, finalUrl: page.url() });
        } catch (e: any) { res.status(500).json({ error: e.message }); }
    });
}

/** GET /screenshot — capture current page as base64 jpeg */
export function setupScreenshotRoute(app: Express) {
    app.get('/screenshot', async (req, res) => {
        try {
            const tabId = (req.query.tabId as string) || 'default';
            applyCorsHeaders(res);
            const url = req.query.url as string | undefined;
            const page = await resolvePage(tabId, url);
            if (!page) return res.status(url ? 503 : 400).json({ error: url ? 'Session unavailable' : 'url required' });
            if (page.isClosed()) return res.status(503).json({ error: 'Session closed' });
            const buf = await page.screenshot({ quality: 70, type: 'jpeg' });
            return res.json({ screenshot: `data:image/jpeg;base64,${buf.toString('base64')}` });
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    });
}

/** GET /screenshot/stream — SSE stream of base64 screenshots */
export function setupScreenshotStreamRoute(app: Express) {
    const STREAM_INTERVAL_MS = 800;
    app.get('/screenshot/stream', async (req, res) => {
        const tabId = (req.query.tabId as string) || 'default';
        const url = req.query.url as string | undefined;
        applyCorsHeaders(res);
        const page = await resolvePage(tabId, url);
        if (!page) { res.status(url ? 503 : 400).end(); return; }
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
        });
        res.flushHeaders?.();
        const timer = setInterval(async () => {
            try {
                if (page.isClosed()) throw new Error('Session closed');
                const buf = await page!.screenshot({ quality: 65, type: 'jpeg' });
                res.write(`data: data:image/jpeg;base64,${buf.toString('base64')}\n\n`);
            } catch (e: any) {
                res.write(`event: error\ndata: ${e.message}\n\n`);
            }
        }, STREAM_INTERVAL_MS);
        req.on('close', () => clearInterval(timer));
    });
}

/** POST /proxy/click — mouse click at absolute Playwright viewport coordinates for manual pass-through */
export function setupCoordClickRoute(app: Express) {
    app.post('/proxy/click', async (req, res): Promise<any> => {
        applyCorsHeaders(res);
        const { x, y, tabId = 'default' } = req.body;
        const page = activePages.get(tabId);
        if (!page) return res.status(503).json({ error: 'No active session' });
        try {
            await page.mouse.click(Number(x), Number(y));
            // Wait briefly for any navigation the click may have triggered to settle
            await page.waitForLoadState('domcontentloaded', { timeout: 2000 }).catch(() => {});
            // Sync immediately — don’t wait for the 5s periodic interval
            await captureAndSyncTab(tabId);
            return res.json({ success: true, finalUrl: page.url() });
        } catch (e: any) { return res.status(500).json({ error: e.message }); }
    });
}

/** GET /proxy/dom-map — return current DOM map + viewport for a tab */
export function setupDomMapRoute(app: Express) {
    app.get('/proxy/dom-map', async (req, res) => {
        try {
            const tabId = (req.query.tabId as string) || 'default';
            applyCorsHeaders(res);
            const url = req.query.url as string | undefined;
            const page = await resolvePage(tabId, url);
            if (!page) return res.status(url ? 503 : 400).json({ error: url ? 'Session unavailable' : 'url required' });
            if (page.isClosed()) return res.status(503).json({ error: 'Session closed' });
            try {
                const payload = await buildDomMap(page, url || '');
                return res.json(payload);
            } catch {
                return res.json({ map: [], viewport: { vw: 0, vh: 0 }, url: url || '' });
            }
        } catch (e: any) {
            applyCorsHeaders(res);
            return res.status(500).json({ error: e.message });
        }
    });
}

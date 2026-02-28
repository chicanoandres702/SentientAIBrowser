// Feature: Browser | Why: Route handlers for proxy action + screenshot — keeps routes file under 100 lines
import { Express } from 'express';
import { getPersistentPage, activePages } from './proxy-page-handler';
import { applyCorsHeaders, resolvePage } from './proxy-route.utils';
import { buildDomMap } from './proxy-dom-map';

/** POST /proxy/action — execute click/type on a persistent page */
export function setupActionRoute(app: Express) {
    app.post('/proxy/action', async (req, res): Promise<any> => {
        applyCorsHeaders(res);
        const { url, action, id, value, tabId = 'default' } = req.body;
        let page = activePages.get(tabId) || await getPersistentPage(url, tabId).catch(() => null);
        if (!page) return res.status(500).json({ error: 'Session died' });
        try {
            const sel = `[data-ai-id="${id}"]`;
            if (action === 'click') {
                await page.evaluate((s) => { const e = document.querySelector(s) as HTMLElement; if (e) { e.scrollIntoView({ block: 'center' }); e.click(); } }, sel);
            } else if (action === 'type') {
                const el = await page.$(sel); if (!el) throw new Error('Not found'); await el.focus();
                await page.evaluate((s) => { (document.querySelector(s) as HTMLInputElement).value = ''; }, sel);
                await el.type(value || '', { delay: 10 });
                await page.evaluate(s => { const e = document.querySelector(s); ['input', 'change'].forEach(t => e?.dispatchEvent(new Event(t, { bubbles: true }))); }, sel);
                if (value?.length) await page.keyboard.press('Enter');
            }
            res.json({ success: true });
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

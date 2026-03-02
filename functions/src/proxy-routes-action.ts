// Feature: Browser | Trace: functions/src/proxy-routes-action.ts
import { Express } from 'express';
import { getPersistentPage, activePages, captureAndSyncTab, saveSessionForTab } from './proxy-page-handler';
import { applyCorsHeaders, resolvePage } from './proxy-route.utils';
import { buildDomMap } from './proxy-dom-map';
import { executeAriaAction } from './features/playwright-mcp';

export function setupActionRoute(app: Express) { app.post('/proxy/action', async (req, res) => { applyCorsHeaders(res); const { url, action, id, value, tabId = 'default', role, name: ariaName, text: ariaText } = req.body as Record<string, unknown>; const page = activePages.get(tabId as string) || (await getPersistentPage(url as string, tabId as string).catch(() => null)); if (!page) return res.status(500).json({ error: 'Session died' });
    try { const finalUrl = await executeAriaAction(page, { action: action as 'click' | 'type', role: role as string, ariaName: ariaName as string, ariaText: ariaText as string, id: id as string, value: value as string }); await captureAndSyncTab(tabId as string); return res.json({ success: true, finalUrl }); } catch (e: unknown) { return res.status(500).json({ error: (e as Error).message }); } }); }
/** GET /screenshot — capture page as base64 jpeg */
export function setupScreenshotRoute(app: Express) {
  app.get('/screenshot', async (req, res) => {
    try {
      const tabId = (req.query.tabId as string) || 'default';
      applyCorsHeaders(res);
      const url = req.query.url as string | undefined;
      const page = await resolvePage(tabId, url);
      if (!page) return res.status(url ? 503 : 404).json({ error: url ? 'Session unavailable' : 'No active session for this tabId' });
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
    if (!page) { res.status(url ? 503 : 404).end(); return; }
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
            const urlBefore = page.url();
            await page.mouse.click(Number(x), Number(y));
            await page.waitForLoadState('domcontentloaded', { timeout: 2000 }).catch(() => {});
            await captureAndSyncTab(tabId);
            if (page.url() !== urlBefore) await saveSessionForTab(tabId);
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
            if (!page) return res.status(url ? 503 : 404).json({ error: url ? 'Session unavailable' : 'No active session for this tabId' });
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
/**
 * Sentient File Header
 * Why: Sets up /screenshot/stream route for Sentient AI Browser proxy server
 * Filepath: functions/src/proxy-route.screenshot-stream.ts
 * Description: Handles GET /screenshot/stream requests, streams tab screenshots as SSE
 * Trace: Used by proxy server, orchestrator, and browser sync modules
 * Wiring: Exported route setup function, consumed by Express app and orchestrator
 */
// Feature: Browser | Trace: functions/src/proxy-route.screenshot-stream.ts
/*
 * [Extracted Logic] GET /screenshot/stream route setup
 * [Law Check] < 100 lines
 */
import { Express } from 'express';
import { applyCorsHeaders, resolvePage } from './proxy-route.utils';
import { getCachedFrame } from './proxy-tab-sync.broker';

export function setupScreenshotStreamRoute(app: Express) {
  const STREAM_INTERVAL_MS = 300;
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
    const heartbeat = setInterval(() => res.write(':heartbeat\n\n'), 15000);
    const timer = setInterval(async () => {
      try {
        if (page.isClosed()) throw new Error('Session closed');
        const cached = getCachedFrame(tabId);
        const frameData = (cached && (Date.now() - cached.ts) < 600)
          ? cached.data
          : `data:image/jpeg;base64,${(await page.screenshot({ quality: 60, type: 'jpeg', timeout: 4000, fullPage: false })).toString('base64')}`;
        res.write(`data: ${frameData}\n\n`);
      } catch (e: any) {
        res.write(`event: error\ndata: ${e.message}\n\n`);
      }
    }, STREAM_INTERVAL_MS);
    req.on('close', () => { clearInterval(timer); clearInterval(heartbeat); });
  });
}

/**
 * Sentient File Header
 * Why: Sets up /screenshot route for Sentient AI Browser proxy server
 * Filepath: functions/src/proxy-route.screenshot.ts
 * Description: Handles GET /screenshot requests, returns tab screenshot as base64
 * Trace: Used by proxy server, orchestrator, and browser sync modules
 * Wiring: Exported route setup function, consumed by Express app and orchestrator
 */
// Feature: Browser | Trace: functions/src/proxy-route.screenshot.ts
/*
 * [Extracted Logic] GET /screenshot route setup
 * [Law Check] < 100 lines
 */
import { Express } from 'express';
import { applyCorsHeaders, resolvePage } from './proxy-route.utils';

export function setupScreenshotRoute(app: Express) {
  app.get('/screenshot', async (req, res) => {
    try {
      const tabId = (req.query.tabId as string) || 'default';
      applyCorsHeaders(res);
      const url = req.query.url as string | undefined;
      const page = await resolvePage(tabId, url);
      if (!page) return res.status(url ? 503 : 404).json({ error: url ? 'Session unavailable' : 'No active session for this tabId' });
      if (page.isClosed()) return res.status(503).json({ error: 'Session closed' });
      const buf = await page.screenshot({ quality: 70, type: 'jpeg', timeout: 8000 });
      return res.json({ screenshot: `data:image/jpeg;base64,${buf.toString('base64')}` });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });
}

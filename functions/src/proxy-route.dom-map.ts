/**
 * Sentient File Header
 * Why: Sets up /proxy/dom-map route for Sentient AI Browser proxy server
 * Filepath: functions/src/proxy-route.dom-map.ts
 * Description: Handles GET /proxy/dom-map requests, returns DOM map and viewport info
 * Trace: Used by proxy server, orchestrator, and browser sync modules
 * Wiring: Exported route setup function, consumed by Express app and orchestrator
 */
// Feature: Browser | Trace: functions/src/proxy-route.dom-map.ts
/*
 * [Extracted Logic] GET /proxy/dom-map route setup
 * [Law Check] < 100 lines
 */
import { Express } from 'express';
import { applyCorsHeaders, resolvePage } from './proxy-route.utils';
import { buildDomMap } from './proxy-dom-map';

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

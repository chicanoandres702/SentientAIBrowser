/**
 * Sentient File Header
 * Why: Sets up /proxy/click route for Sentient AI Browser proxy server
 * Filepath: functions/src/proxy-route.coord-click.ts
 * Description: Handles POST /proxy/click requests, performs mouse click and syncs tab
 * Trace: Used by proxy server, orchestrator, and browser sync modules
 * Wiring: Exported route setup function, consumed by Express app and orchestrator
 */
// Feature: Browser | Trace: functions/src/proxy-route.coord-click.ts
/*
 * [Extracted Logic] POST /proxy/click route setup
 * [Law Check] < 100 lines
 */
import { Express } from 'express';
import { applyCorsHeaders } from './proxy-route.utils';
import { activePages, captureAndSyncTab, saveSessionForTab } from './proxy-page-handler';

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

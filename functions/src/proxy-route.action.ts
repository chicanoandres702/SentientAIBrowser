// Feature: Browser | Trace: functions/src/proxy-route.action.ts
/*
 * [Extracted Logic] POST /proxy/action route setup
 * [Law Check] < 100 lines
 */
import { Express } from 'express';
import { getPersistentPage, activePages, captureAndSyncTab } from './proxy-page-handler';
import { applyCorsHeaders } from './proxy-route.utils';
import { executeAriaAction } from './features/playwright-mcp';

export function setupActionRoute(app: Express) {
  app.post('/proxy/action', async (req, res) => {
    applyCorsHeaders(res);
    const { url, action, id, value, tabId = 'default', role, name: ariaName, text: ariaText } = req.body as Record<string, unknown>;
    const page = activePages.get(tabId as string) || (await getPersistentPage(url as string, tabId as string).catch(() => null));
    if (!page) return res.status(500).json({ error: 'Session died' });
    try {
      const finalUrl = await executeAriaAction(page, { action: action as 'click' | 'type', role: role as string, ariaName: ariaName as string, ariaText: ariaText as string, id: id as string, value: value as string });
      await captureAndSyncTab(tabId as string);
      return res.json({ success: true, finalUrl });
    } catch (e: unknown) {
      return res.status(500).json({ error: (e as Error).message });
    }
  });
}

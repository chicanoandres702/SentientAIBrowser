// Feature: Remote Input | Why: Full direct mouse control in remote mode — move, scroll,
// right-click, double-click, drag. Complements POST /proxy/click (single left-click).
// Every action syncs the tab immediately so the screenshot stream stays current.
import { Express } from 'express';
import { activePages, captureAndSyncTab } from './proxy-page-handler';
import { applyCorsHeaders } from './proxy-route.utils';

/** POST /proxy/mouse/move  — hover to (x, y) without clicking */
export function setupMouseRoutes(app: Express): void {
    app.post('/proxy/mouse/move', async (req, res): Promise<any> => {
        applyCorsHeaders(res);
        const { x, y, tabId = 'default' } = req.body;
        const page = activePages.get(tabId);
        if (!page) return res.status(503).json({ error: 'No active session' });
        try {
            await page.mouse.move(Number(x), Number(y));
            await captureAndSyncTab(tabId);
            return res.json({ success: true });
        } catch (e: any) { return res.status(500).json({ error: e.message }); }
    });

    /** POST /proxy/mouse/dblclick — double-click at (x, y) */
    app.post('/proxy/mouse/dblclick', async (req, res): Promise<any> => {
        applyCorsHeaders(res);
        const { x, y, tabId = 'default' } = req.body;
        const page = activePages.get(tabId);
        if (!page) return res.status(503).json({ error: 'No active session' });
        try {
            await page.mouse.dblclick(Number(x), Number(y));
            await page.waitForLoadState('domcontentloaded', { timeout: 2000 }).catch(() => {});
            await captureAndSyncTab(tabId);
            return res.json({ success: true, finalUrl: page.url() });
        } catch (e: any) { return res.status(500).json({ error: e.message }); }
    });

    /** POST /proxy/mouse/rightclick — right-click at (x, y) — opens context menu */
    app.post('/proxy/mouse/rightclick', async (req, res): Promise<any> => {
        applyCorsHeaders(res);
        const { x, y, tabId = 'default' } = req.body;
        const page = activePages.get(tabId);
        if (!page) return res.status(503).json({ error: 'No active session' });
        try {
            await page.mouse.click(Number(x), Number(y), { button: 'right' });
            await captureAndSyncTab(tabId);
            return res.json({ success: true });
        } catch (e: any) { return res.status(500).json({ error: e.message }); }
    });

    /** POST /proxy/mouse/scroll — scroll wheel at (x, y) by (deltaX, deltaY) pixels */
    app.post('/proxy/mouse/scroll', async (req, res): Promise<any> => {
        applyCorsHeaders(res);
        const { x: _x, y: _y, deltaX = 0, deltaY = 100, tabId = 'default' } = req.body;
        const page = activePages.get(tabId);
        if (!page) return res.status(503).json({ error: 'No active session' });
        try {
            await page.mouse.wheel(Number(deltaX), Number(deltaY));
            await captureAndSyncTab(tabId);
            return res.json({ success: true });
        } catch (e: any) { return res.status(500).json({ error: e.message }); }
    });

    /**
     * POST /proxy/mouse/drag
     * Body: { fromX, fromY, toX, toY, tabId? }
     * Why: drag-and-drop interactions need mousedown → move → mouseup at precise coords.
     * Uses low-level mouse API so Playwright fires the real pointer events.
     */
    app.post('/proxy/mouse/drag', async (req, res): Promise<any> => {
        applyCorsHeaders(res);
        const { fromX, fromY, toX, toY, tabId = 'default' } = req.body;
        const page = activePages.get(tabId);
        if (!page) return res.status(503).json({ error: 'No active session' });
        try {
            await page.mouse.move(Number(fromX), Number(fromY));
            await page.mouse.down();
            await page.mouse.move(Number(toX), Number(toY), { steps: 10 });
            await page.mouse.up();
            await captureAndSyncTab(tabId);
            return res.json({ success: true });
        } catch (e: any) { return res.status(500).json({ error: e.message }); }
    });
}

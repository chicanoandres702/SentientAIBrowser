// Feature: Navigation | Why: Direct navigate endpoint — gives frontend redirect-aware results
import { Express } from 'express';
import { applyCorsHeaders, getUserIdFromReq } from './proxy-route.utils';
import { activePages, getPersistentPage, closePage, closeAllPagesForUser } from './proxy-page-handler';
import { guardedNavigate, isNavLocked } from './proxy-nav-controller';
import { db } from './proxy-config';

/**
 * POST /proxy/navigate
 * Body: { url, tabId? }
 * Returns: { finalUrl, wasRedirected }
 *
 * Why: The frontend calls this instead of writing URL_A to Firestore and waiting for
 * the Firestore listener roundtrip. It gets the RESOLVED url (after all server-side
 * redirects) back immediately, then writes finalUrl to Firestore — so the LLM always
 * sees the real destination, not the original requested URL.
 */
export function setupNavRoute(app: Express): void {
    app.options('/proxy/navigate', (_req, res) => {
        applyCorsHeaders(res);
        res.sendStatus(204);
    });

    app.options('/proxy/back', (_req, res) => {
        applyCorsHeaders(res);
        res.sendStatus(204);
    });

    app.options('/proxy/forward', (_req, res) => {
        applyCorsHeaders(res);
        res.sendStatus(204);
    });

    app.post('/proxy/navigate', async (req, res): Promise<any> => {
        applyCorsHeaders(res);
        const { url, tabId = 'default' } = req.body;
        if (!url) return res.status(400).json({ error: 'url required' });
        // Why: userId is needed so getPersistentPage restores the right session on cold start.
        const userId = getUserIdFromReq(req);

        // Return 409 instead of silently dropping — lets client decide to retry or wait
        if (isNavLocked(tabId)) {
            return res.status(409).json({ error: 'Navigation already in progress', tabId });
        }

        try {
            // Ensure a page exists for this tab (creates one if needed)
            let page = activePages.get(tabId) ?? undefined;
            if (!page) page = await getPersistentPage(url, tabId, userId).catch(() => undefined);
            if (!page) return res.status(503).json({ error: 'No active session for tab' });

            const result = await guardedNavigate(page, tabId, url);
            return res.json(result);
        } catch (e: any) {
            console.error('[/proxy/navigate] Error:', e.message);
            return res.status(500).json({ error: e.message });
        }
    });

    /**
     * POST /proxy/back
     * Body: { tabId? }
     * Returns: { finalUrl, moved }
     */
    app.post('/proxy/back', async (req, res): Promise<any> => {
        applyCorsHeaders(res);
        const { tabId = 'default' } = req.body || {};
        const userId = getUserIdFromReq(req);

        try {
            let page = activePages.get(tabId) ?? undefined;
            if (!page) page = await getPersistentPage(null, tabId, userId).catch(() => undefined);
            if (!page) return res.status(503).json({ error: 'No active session for tab' });

            const before = page.url();
            await page.goBack({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => null);
            const finalUrl = page.url() || before;
            return res.json({ finalUrl, moved: finalUrl !== before });
        } catch (e: any) {
            console.error('[/proxy/back] Error:', e.message);
            return res.status(500).json({ error: e.message });
        }
    });

    /**
     * POST /proxy/forward
     * Body: { tabId? }
     * Returns: { finalUrl, moved }
     */
    app.post('/proxy/forward', async (req, res): Promise<any> => {
        applyCorsHeaders(res);
        const { tabId = 'default' } = req.body || {};
        const userId = getUserIdFromReq(req);

        try {
            let page = activePages.get(tabId) ?? undefined;
            if (!page) page = await getPersistentPage(null, tabId, userId).catch(() => undefined);
            if (!page) return res.status(503).json({ error: 'No active session for tab' });

            const before = page.url();
            await page.goForward({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => null);
            const finalUrl = page.url() || before;
            return res.json({ finalUrl, moved: finalUrl !== before });
        } catch (e: any) {
            console.error('[/proxy/forward] Error:', e.message);
            return res.status(500).json({ error: e.message });
        }
    });

    /**
     * DELETE /proxy/tab/:tabId
     * Why: When the user closes a tab in the UI, the 5-second captureAndSync interval
     * must be cleared before the Firestore doc is removed. Without this, the interval
     * fires after the doc is deleted and re-creates it — causing the tab to ghost back.
     * This endpoint kills the interval, closes the Playwright page + context cleanly.
     */
    app.delete('/proxy/tab/:tabId', async (req, res): Promise<any> => {
        applyCorsHeaders(res);
        const { tabId } = req.params;
        try {
            closePage(tabId);
            try { await db.collection('browser_tabs').doc(tabId).delete(); } catch { /* non-fatal */ }
            return res.json({ success: true, tabId });
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    });

    /**
     * DELETE /proxy/close-all
     * Body: { userId }
     * Closes every active Playwright session for the given user, stops all sync intervals,
     * and removes the tab docs from Firestore — called when the user exits a workspace.
     */
    app.options('/proxy/close-all', (_req, res) => { applyCorsHeaders(res); res.sendStatus(204); });
    app.delete('/proxy/close-all', async (req, res): Promise<any> => {
        applyCorsHeaders(res);
        const userId = getUserIdFromReq(req);
        if (!userId || userId === 'anonymous') return res.status(401).json({ error: 'userId required' });
        try {
            closeAllPagesForUser(userId);
            return res.json({ success: true, message: `All sessions closed for ${userId}` });
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    });
}

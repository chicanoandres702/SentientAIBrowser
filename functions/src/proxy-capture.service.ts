// Feature: Capture Service | Trace: README.md
import { Page, BrowserContext } from 'playwright';
import { db } from './proxy-config';
import { isAuthWallUrl } from './proxy-nav-controller';
import { saveSession } from './proxy-session.service';
import { broadcastTabSync, setFrameProvider } from './proxy-tab-sync.broker';
import { getCachedFrame, setCachedFrame } from './proxy-frame-cache';
import { activePages, activeContexts, activeUserIds, closedTabs, redirectingTabs } from './proxy-page-registry';

let firestoreAvailable = true;

// Why: register a frame getter with the broker so it can drive the 4fps streaming interval
// without needing to import proxy-page-handler (which would create a circular dep).
setFrameProvider(async (tabId) => {
    const page = activePages.get(tabId);
    if (!page || page.isClosed()) return null;
    try {
        // Why: fullPage:false (viewport clip only) is 3-5x faster than full-page capture
        const buf = await page.screenshot({ quality: 55, type: 'jpeg', timeout: 3000, fullPage: false });
        return { data: `data:image/jpeg;base64,${buf.toString('base64')}`, url: page.url() };
    } catch { return null; }
});

export async function captureAndSync(tabId: string, userId: string, page: Page, _ctx: BrowserContext): Promise<void> {
    if (closedTabs.has(tabId)) { console.debug(`[CaptureSync] ⛔ skip tombstoned tab ${tabId}`); return; }
    if (!firestoreAvailable) { console.debug(`[CaptureSync] ⛔ skip – Firestore unavailable`); return; }
    if (redirectingTabs.has(tabId)) { console.debug(`[CaptureSync] ⏳ skip – tab ${tabId} still redirecting`); return; }
    const currentUrl = page.url();
    if (!currentUrl || currentUrl === 'about:blank' || currentUrl === 'about:newtab') { console.debug(`[CaptureSync] ⛔ skip blank/newtab for ${tabId}`); return; }
    const isAuthWall = isAuthWallUrl(currentUrl);
    console.debug(`[CaptureSync] 📸 capturing tab=${tabId} url=${currentUrl}${isAuthWall ? ' ⚠️AUTH-WALL (Firestore write suppressed)' : ''}`);
    try {
        const _cached = getCachedFrame(tabId);
        // Why: reuse the frame-stream's cached screenshot if ≤1s old — prevents a second
        //      concurrent page.screenshot() from stacking behind the 4fps stream and hanging.
        let screenshot: string;
        if (_cached && (Date.now() - _cached.ts) <= 1000) {
            screenshot = _cached.data.replace('data:image/jpeg;base64,', '');
        } else {
            const buf = await page.screenshot({ quality: 60, type: 'jpeg', timeout: 8000, fullPage: false });
            screenshot = buf.toString('base64');
            setCachedFrame(tabId, { data: `data:image/jpeg;base64,${screenshot}`, url: currentUrl });
        }
        const title = (await page.title()) || 'Loading...';
        broadcastTabSync(tabId, { type: 'url',        tabId, url: currentUrl, title });
        broadcastTabSync(tabId, { type: 'screenshot', tabId, data: `data:image/jpeg;base64,${screenshot}`, url: currentUrl });
        if (isAuthWall) { console.debug(`[CaptureSync] ⛔ skipped Firestore write for auth-wall url=${currentUrl}`); return; }
        await db.collection('browser_tabs').doc(tabId).set({
            id: tabId, screenshot: `data:image/jpeg;base64,${screenshot}`,
            url: currentUrl, title, source: 'proxy',
            ...(userId && userId !== 'default' ? { user_id: userId } : {}),
            last_sync: new Date().toISOString(),
        }, { merge: true });
        console.debug(`[CaptureSync] ✅ wrote tab=${tabId} url=${currentUrl} user=${userId}`);
    } catch (e: unknown) {
        const msg = (e as Error).message;
        if (msg.includes('credentials') || msg.includes('Could not load the default')) {
            firestoreAvailable = false;
            console.warn(`[CaptureSync] ⚠️ Firestore sync disabled (no credentials). Screenshots available via /screenshot route.`);
        } else if (msg.includes('Timeout') || msg.includes('waiting for fonts')) {
            console.warn(`[CaptureSync] ⏱ screenshot timeout tab=${tabId} (font stall) — skipping`);
        } else if (!msg.includes('Target closed') && !msg.includes('Execution context was destroyed')) {
            console.error(`[CaptureSync] ❌ Sync failed tab=${tabId}:`, msg);
        }
    }
}

/** Publicly trigger an immediate captureAndSync for a tab (called by click/action routes). */
export async function captureAndSyncTab(tabId: string): Promise<void> {
    const page = activePages.get(tabId);
    const context = activeContexts.get(tabId);
    const userId = activeUserIds.get(tabId) || 'default';
    if (!page || !context) return;
    await captureAndSync(tabId, userId, page, context);
}

/** Force-save cookies for a tab — call after login/form-submit actions to persist immediately. */
export async function saveSessionForTab(tabId: string): Promise<void> {
    const userId = activeUserIds.get(tabId);
    const context = activeContexts.get(tabId);
    if (!userId || userId === 'default' || !context) return;
    await saveSession(userId, context).catch(() => {});
}

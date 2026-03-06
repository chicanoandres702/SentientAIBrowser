"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.captureAndSync = captureAndSync;
exports.captureAndSyncTab = captureAndSyncTab;
exports.saveSessionForTab = saveSessionForTab;
const proxy_config_1 = require("./proxy-config");
const proxy_nav_controller_1 = require("./proxy-nav-controller");
const proxy_session_service_1 = require("./proxy-session.service");
const proxy_tab_sync_broker_1 = require("./proxy-tab-sync.broker");
const proxy_frame_cache_1 = require("./proxy-frame-cache");
const proxy_page_registry_1 = require("./proxy-page-registry");
let firestoreAvailable = true;
// Why: register a frame getter with the broker so it can drive the 4fps streaming interval
// without needing to import proxy-page-handler (which would create a circular dep).
(0, proxy_tab_sync_broker_1.setFrameProvider)(async (tabId) => {
    const page = proxy_page_registry_1.activePages.get(tabId);
    if (!page || page.isClosed())
        return null;
    try {
        // Why: fullPage:false (viewport clip only) is 3-5x faster than full-page capture
        const buf = await page.screenshot({ quality: 55, type: 'jpeg', timeout: 3000, fullPage: false });
        return { data: `data:image/jpeg;base64,${buf.toString('base64')}`, url: page.url() };
    }
    catch (_a) {
        return null;
    }
});
async function captureAndSync(tabId, userId, page, _ctx) {
    if (proxy_page_registry_1.closedTabs.has(tabId)) {
        console.debug(`[CaptureSync] ⛔ skip tombstoned tab ${tabId}`);
        return;
    }
    if (!firestoreAvailable) {
        console.debug(`[CaptureSync] ⛔ skip – Firestore unavailable`);
        return;
    }
    if (proxy_page_registry_1.redirectingTabs.has(tabId)) {
        console.debug(`[CaptureSync] ⏳ skip – tab ${tabId} still redirecting`);
        return;
    }
    const currentUrl = page.url();
    if (!currentUrl || currentUrl === 'about:blank' || currentUrl === 'about:newtab') {
        console.debug(`[CaptureSync] ⛔ skip blank/newtab for ${tabId}`);
        return;
    }
    const isAuthWall = (0, proxy_nav_controller_1.isAuthWallUrl)(currentUrl);
    console.debug(`[CaptureSync] 📸 capturing tab=${tabId} url=${currentUrl}${isAuthWall ? ' ⚠️AUTH-WALL (Firestore write suppressed)' : ''}`);
    try {
        const _cached = (0, proxy_frame_cache_1.getCachedFrame)(tabId);
        // Why: reuse the frame-stream's cached screenshot if ≤1s old — prevents a second
        //      concurrent page.screenshot() from stacking behind the 4fps stream and hanging.
        let screenshot;
        if (_cached && (Date.now() - _cached.ts) <= 1000) {
            screenshot = _cached.data.replace('data:image/jpeg;base64,', '');
        }
        else {
            const buf = await page.screenshot({ quality: 60, type: 'jpeg', timeout: 8000, fullPage: false });
            screenshot = buf.toString('base64');
            (0, proxy_frame_cache_1.setCachedFrame)(tabId, { data: `data:image/jpeg;base64,${screenshot}`, url: currentUrl });
        }
        const title = (await page.title()) || 'Loading...';
        (0, proxy_tab_sync_broker_1.broadcastTabSync)(tabId, { type: 'url', tabId, url: currentUrl, title });
        (0, proxy_tab_sync_broker_1.broadcastTabSync)(tabId, { type: 'screenshot', tabId, data: `data:image/jpeg;base64,${screenshot}`, url: currentUrl });
        if (isAuthWall) {
            console.debug(`[CaptureSync] ⛔ skipped Firestore write for auth-wall url=${currentUrl}`);
            return;
        }
        await proxy_config_1.db.collection('browser_tabs').doc(tabId).set(Object.assign(Object.assign({ id: tabId, screenshot: `data:image/jpeg;base64,${screenshot}`, url: currentUrl, title, source: 'proxy' }, (userId && userId !== 'default' ? { user_id: userId } : {})), { last_sync: new Date().toISOString() }), { merge: true });
        console.debug(`[CaptureSync] ✅ wrote tab=${tabId} url=${currentUrl} user=${userId}`);
    }
    catch (e) {
        const msg = e.message;
        if (msg.includes('credentials') || msg.includes('Could not load the default')) {
            firestoreAvailable = false;
            console.warn(`[CaptureSync] ⚠️ Firestore sync disabled (no credentials). Screenshots available via /screenshot route.`);
        }
        else if (msg.includes('Timeout') || msg.includes('waiting for fonts')) {
            console.warn(`[CaptureSync] ⏱ screenshot timeout tab=${tabId} (font stall) — skipping`);
        }
        else if (!msg.includes('Target closed') && !msg.includes('Execution context was destroyed')) {
            console.error(`[CaptureSync] ❌ Sync failed tab=${tabId}:`, msg);
        }
    }
}
/** Publicly trigger an immediate captureAndSync for a tab (called by click/action routes). */
async function captureAndSyncTab(tabId) {
    const page = proxy_page_registry_1.activePages.get(tabId);
    const context = proxy_page_registry_1.activeContexts.get(tabId);
    const userId = proxy_page_registry_1.activeUserIds.get(tabId) || 'default';
    if (!page || !context)
        return;
    await captureAndSync(tabId, userId, page, context);
}
/** Force-save cookies for a tab — call after login/form-submit actions to persist immediately. */
async function saveSessionForTab(tabId) {
    const userId = proxy_page_registry_1.activeUserIds.get(tabId);
    const context = proxy_page_registry_1.activeContexts.get(tabId);
    if (!userId || userId === 'default' || !context)
        return;
    await (0, proxy_session_service_1.saveSession)(userId, context).catch(() => { });
}
//# sourceMappingURL=proxy-capture.service.js.map
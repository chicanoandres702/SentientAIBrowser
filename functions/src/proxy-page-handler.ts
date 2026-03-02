// Feature: Page Lifecycle | Trace: README.md
/*
 * [Parent Feature/Milestone] Page Lifecycle
 * [Child Task/Issue] Architecture Refactor — Split proxy-page-handler.ts
 * [Subtask] Slim coordinator: delegates stealth/registry/capture/events to sub-modules
 * [Upstream] proxy-stealth.config + proxy-page-registry + proxy-capture.service + proxy-page-events
 * [Downstream] All route files (proxy-routes-*.ts) that need activePages / getPersistentPage
 * [Law Check] 87 lines | Passed 100-Line Law
 */
import { getBrowser, isCdpMode } from './proxy-config';
import { guardedNavigate } from './proxy-nav-controller';
import { loadSession, saveSession, sessionFilePath } from './proxy-session.service';
import { attachConsoleListener, clearConsoleLogs } from './proxy-cdp.service';
import { attachUrlWatcher, clearUrlWatcher } from './proxy-url-watcher';
import { activePages, activeContexts, activeUserIds, syncIntervals, closedTabs, redirectingTabs, redirectDebounceTimers } from './proxy-page-registry';
import { STEALTH_UA, STEALTH_INIT_SCRIPT, setupRequestBlocking } from './proxy-stealth.config';
import { captureAndSync } from './proxy-capture.service';
import { attachPageEventListeners } from './proxy-page-events';

// Re-export registry maps for backward compat — all route files import these from here
export { activePages, activeContexts } from './proxy-page-registry';
// Re-export capture helpers — route files call these after click/type/nav actions
export { captureAndSyncTab, saveSessionForTab } from './proxy-capture.service';

export async function getPersistentPage(targetUrl: string | null, tabId: string, userId = 'default') {
    const browser = await getBrowser();
    let page = activePages.get(tabId);
    // Why: evict stale closed pages to prevent "Target page has been closed" errors
    if (page && page.isClosed()) { closePage(tabId); page = undefined; }
    if (!page) {
        let context;
        if (isCdpMode()) {
            // Why: CDP mode attaches to the user's real Chrome profile — reuse existing context
            const existing = browser.contexts();
            context = existing[0] ?? await browser.newContext();
            console.log(`[CDP] Using real Chrome profile context (${existing.length} context(s) available)`);
            page = await context.newPage();
            console.log(`[CDP] Opened new Chrome tab for tabId=${tabId} (${context.pages().length} tab(s) in Chrome)`);
        } else {
            // Why: restore prior session (cookies + localStorage) so logins persist across restarts
            const savedSession = await loadSession(userId);
            context = await browser.newContext({
                userAgent: STEALTH_UA,
                viewport: { width: 1280, height: 800 },
                locale: 'en-US',
                timezoneId: 'America/New_York',
                extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
                ...(savedSession ? { storageState: savedSession } : {}),
            });
            if (savedSession) console.log(`[Session] Restored cookies for user: ${userId}`);
            await context.addInitScript(STEALTH_INIT_SCRIPT);
        }
        if (!page) page = await context.newPage();
        await setupRequestBlocking(page);
        activePages.set(tabId, page);
        activeContexts.set(tabId, context);
        activeUserIds.set(tabId, userId);
        attachConsoleListener(tabId, page);
        await attachUrlWatcher(page, tabId, userId);
        attachPageEventListeners(page, tabId, userId, context);
        if (userId && userId !== 'default') console.log(`[Session] 💾 User data path: ${sessionFilePath(userId)}`);
        let tick = 0;
        const interval = setInterval(() => {
            console.debug(`[Interval] tick tab=${tabId} tick#${tick + 1} url=${page!.url()}`);
            captureAndSync(tabId, userId, page!, context);
            tick++;
            if (!isCdpMode() && tick % 2 === 0) saveSession(userId, context).catch(() => {});
        }, 5000);
        syncIntervals.set(tabId, interval);
    }
    const currentUrl = page.url();
    if (targetUrl && (currentUrl === 'about:blank' || (!currentUrl.includes(targetUrl) && !targetUrl.includes(currentUrl)))) {
        await guardedNavigate(page, tabId, targetUrl);
        await captureAndSync(tabId, userId, page, activeContexts.get(tabId)!);
        if (!isCdpMode()) saveSession(userId, activeContexts.get(tabId)!).catch(() => {});
    }
    return page;
}

export function closePage(id: string): void {
    console.log(`[Page] 🗑️  closing tab=${id}`);
    closedTabs.add(id);
    clearConsoleLogs(id);
    clearUrlWatcher(id);
    if (syncIntervals.has(id)) { clearInterval(syncIntervals.get(id)!); syncIntervals.delete(id); }
    if (redirectDebounceTimers.has(id)) { clearTimeout(redirectDebounceTimers.get(id)!); redirectDebounceTimers.delete(id); }
    redirectingTabs.delete(id);
    const userId = activeUserIds.get(id);
    const context = activeContexts.get(id);
    if (userId && context) saveSession(userId, context).catch(() => {});
    activeUserIds.delete(id);
    if (activePages.has(id)) { activePages.get(id)!.close().catch(() => {}); activePages.delete(id); }
    if (activeContexts.has(id)) { activeContexts.get(id)!.close().catch(() => {}); activeContexts.delete(id); }
}

export function closeAllPagesForUser(userId: string): void {
    for (const [tabId, uid] of activeUserIds.entries()) {
        if (uid === userId) closePage(tabId);
    }
}

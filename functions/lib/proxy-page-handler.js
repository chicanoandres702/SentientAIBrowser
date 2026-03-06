"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveSessionForTab = exports.captureAndSyncTab = exports.activeContexts = exports.activePages = void 0;
exports.getPersistentPage = getPersistentPage;
exports.closePage = closePage;
exports.closeAllPagesForUser = closeAllPagesForUser;
/**
 * Sentient File Header
 * Why: Page lifecycle handler for Sentient AI Browser
 * Filepath: functions/src/proxy-page-handler.ts
 * Description: Coordinates page creation, session restore, and event listeners
 * Trace: Used by backend, orchestrator, and all route files
 * Wiring: Exported helpers, consumed by backend and route modules
 */
// Feature: Page Lifecycle | Trace: README.md
/*
 * [Parent Feature/Milestone] Page Lifecycle
 * [Child Task/Issue] Architecture Refactor — Split proxy-page-handler.ts
 * [Subtask] Slim coordinator: delegates stealth/registry/capture/events to sub-modules
 * [Upstream] proxy-stealth.config + proxy-page-registry + proxy-capture.service + proxy-page-events
 * [Downstream] All route files (proxy-routes-*.ts) that need activePages / getPersistentPage
 * [Law Check] 87 lines | Passed 100-Line Law
 */
const proxy_config_1 = require("./proxy-config");
const proxy_nav_controller_1 = require("./proxy-nav-controller");
const proxy_session_service_1 = require("./proxy-session.service");
const proxy_cdp_service_1 = require("./proxy-cdp.service");
const proxy_url_watcher_1 = require("./proxy-url-watcher");
const proxy_page_registry_1 = require("./proxy-page-registry");
const proxy_stealth_config_1 = require("./proxy-stealth.config");
const proxy_capture_service_1 = require("./proxy-capture.service");
const proxy_page_events_1 = require("./proxy-page-events");
// Re-export registry maps for backward compat — all route files import these from here
var proxy_page_registry_2 = require("./proxy-page-registry");
Object.defineProperty(exports, "activePages", { enumerable: true, get: function () { return proxy_page_registry_2.activePages; } });
Object.defineProperty(exports, "activeContexts", { enumerable: true, get: function () { return proxy_page_registry_2.activeContexts; } });
// Re-export capture helpers — route files call these after click/type/nav actions
var proxy_capture_service_2 = require("./proxy-capture.service");
Object.defineProperty(exports, "captureAndSyncTab", { enumerable: true, get: function () { return proxy_capture_service_2.captureAndSyncTab; } });
Object.defineProperty(exports, "saveSessionForTab", { enumerable: true, get: function () { return proxy_capture_service_2.saveSessionForTab; } });
async function getPersistentPage(targetUrl, tabId, userId = 'default') {
    var _a;
    const browser = await (0, proxy_config_1.getBrowser)();
    let page = proxy_page_registry_1.activePages.get(tabId);
    // Why: evict stale closed pages to prevent "Target page has been closed" errors
    if (page && page.isClosed()) {
        closePage(tabId);
        page = undefined;
    }
    if (!page) {
        let context;
        if ((0, proxy_config_1.isCdpMode)()) {
            // Why: CDP mode attaches to the user's real Chrome profile — reuse existing context
            const existing = browser.contexts();
            context = (_a = existing[0]) !== null && _a !== void 0 ? _a : await browser.newContext();
            console.log(`[CDP] Using real Chrome profile context (${existing.length} context(s) available)`);
            page = await context.newPage();
            console.log(`[CDP] Opened new Chrome tab for tabId=${tabId} (${context.pages().length} tab(s) in Chrome)`);
        }
        else {
            // Why: restore prior session (cookies + localStorage) so logins persist across restarts
            const savedSession = await (0, proxy_session_service_1.loadSession)(userId);
            context = await browser.newContext(Object.assign({ userAgent: proxy_stealth_config_1.STEALTH_UA, viewport: { width: 1280, height: 800 }, locale: 'en-US', timezoneId: 'America/New_York', extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' } }, (savedSession ? { storageState: savedSession } : {})));
            if (savedSession)
                console.log(`[Session] Restored cookies for user: ${userId}`);
            await context.addInitScript(proxy_stealth_config_1.STEALTH_INIT_SCRIPT);
        }
        if (!page)
            page = await context.newPage();
        await (0, proxy_stealth_config_1.setupRequestBlocking)(page);
        proxy_page_registry_1.activePages.set(tabId, page);
        proxy_page_registry_1.activeContexts.set(tabId, context);
        proxy_page_registry_1.activeUserIds.set(tabId, userId);
        (0, proxy_cdp_service_1.attachConsoleListener)(tabId, page);
        await (0, proxy_url_watcher_1.attachUrlWatcher)(page, tabId, userId);
        (0, proxy_page_events_1.attachPageEventListeners)(page, tabId, userId, context);
        if (userId && userId !== 'default')
            console.log(`[Session] 💾 User data path: ${(0, proxy_session_service_1.sessionFilePath)(userId)}`);
        let tick = 0;
        const interval = setInterval(() => {
            console.debug(`[Interval] tick tab=${tabId} tick#${tick + 1} url=${page.url()}`);
            (0, proxy_capture_service_1.captureAndSync)(tabId, userId, page, context);
            tick++;
            if (!(0, proxy_config_1.isCdpMode)() && tick % 2 === 0)
                (0, proxy_session_service_1.saveSession)(userId, context).catch(() => { });
        }, 5000);
        proxy_page_registry_1.syncIntervals.set(tabId, interval);
    }
    const currentUrl = page.url();
    if (targetUrl && (currentUrl === 'about:blank' || (!currentUrl.includes(targetUrl) && !targetUrl.includes(currentUrl)))) {
        await (0, proxy_nav_controller_1.guardedNavigate)(page, tabId, targetUrl);
        await (0, proxy_capture_service_1.captureAndSync)(tabId, userId, page, proxy_page_registry_1.activeContexts.get(tabId));
        if (!(0, proxy_config_1.isCdpMode)())
            (0, proxy_session_service_1.saveSession)(userId, proxy_page_registry_1.activeContexts.get(tabId)).catch(() => { });
    }
    return page;
}
function closePage(id) {
    console.log(`[Page] 🗑️  closing tab=${id}`);
    proxy_page_registry_1.closedTabs.add(id);
    (0, proxy_cdp_service_1.clearConsoleLogs)(id);
    (0, proxy_url_watcher_1.clearUrlWatcher)(id);
    if (proxy_page_registry_1.syncIntervals.has(id)) {
        clearInterval(proxy_page_registry_1.syncIntervals.get(id));
        proxy_page_registry_1.syncIntervals.delete(id);
    }
    if (proxy_page_registry_1.redirectDebounceTimers.has(id)) {
        clearTimeout(proxy_page_registry_1.redirectDebounceTimers.get(id));
        proxy_page_registry_1.redirectDebounceTimers.delete(id);
    }
    proxy_page_registry_1.redirectingTabs.delete(id);
    const userId = proxy_page_registry_1.activeUserIds.get(id);
    const context = proxy_page_registry_1.activeContexts.get(id);
    if (userId && context)
        (0, proxy_session_service_1.saveSession)(userId, context).catch(() => { });
    proxy_page_registry_1.activeUserIds.delete(id);
    if (proxy_page_registry_1.activePages.has(id)) {
        proxy_page_registry_1.activePages.get(id).close().catch(() => { });
        proxy_page_registry_1.activePages.delete(id);
    }
    if (proxy_page_registry_1.activeContexts.has(id)) {
        proxy_page_registry_1.activeContexts.get(id).close().catch(() => { });
        proxy_page_registry_1.activeContexts.delete(id);
    }
}
function closeAllPagesForUser(userId) {
    for (const [tabId, uid] of proxy_page_registry_1.activeUserIds.entries()) {
        if (uid === userId)
            closePage(tabId);
    }
}
//# sourceMappingURL=proxy-page-handler.js.map
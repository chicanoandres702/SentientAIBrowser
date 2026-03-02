// Feature: Navigation | Why: Real-time URL watcher — every address-bar change hits Firestore
// immediately via Playwright's CDP WebSocket bridge, including SPA pushState/replaceState.
/*
 * [Parent Feature/Milestone] Navigation
 * [Child Task/Issue] Instant URL sync
 * [Subtask] Expose __pwUrlSync callback + patch history API in page context
 * [Upstream] Playwright CDP -> [Downstream] Firestore browser_tabs.url
 * [Law Check] 78 lines | Passed 100-Line Law
 */
import { Page } from 'playwright';
import { db } from './proxy-config';

// Why: deduplicate rapid-fire calls (pushState can fire multiple times per navigation).
const lastSyncedUrl = new Map<string, string>();

// Why: debounce timer so a flurry of pushState calls (wizard pages, param updates) coalesces
// into one Firestore write instead of hammering the DB on every keystroke/state update.
const urlDebounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

const URL_DEBOUNCE_MS = 200;

function pushUrlToFirestore(tabId: string, userId: string, url: string): void {
    if (!url || url === 'about:blank' || url === 'about:newtab') return;
    if (lastSyncedUrl.get(tabId) === url) return; // exact-duplicate suppression
    lastSyncedUrl.set(tabId, url);

    const existing = urlDebounceTimers.get(tabId);
    if (existing) clearTimeout(existing);
    urlDebounceTimers.set(tabId, setTimeout(() => {
        urlDebounceTimers.delete(tabId);
        db.collection('browser_tabs').doc(tabId).set({
            id: tabId,
            url,
            source: 'proxy',
            last_sync: new Date().toISOString(),
            ...(userId && userId !== 'default' ? { user_id: userId } : {}),
        }, { merge: true })
            .then(() => console.debug(`[UrlWatcher] ✅ synced tab=${tabId} url=${url}`))
            .catch((e: Error) => console.warn(`[UrlWatcher] ⚠️ Firestore write failed tab=${tabId}:`, e.message));
    }, URL_DEBOUNCE_MS));
}

/**
 * Attach the URL watcher to a freshly created Playwright page.
 *
 * Why exposeFunction:
 *   Playwright uses the CDP Runtime.addBinding API under the hood. The browser calls
 *   the bound function synchronously via the CDP WebSocket — no polling, no HTTP round-trip.
 *   Init script patches history.pushState / replaceState / hashchange so every SPA route
 *   change calls __pwUrlSync, which Playwright delivers via CDP to our Node.js callback.
 *
 * Call this BEFORE any page.goto so the init script is in place for the first navigation.
 */
export async function attachUrlWatcher(page: Page, tabId: string, userId: string): Promise<void> {
    // Why: exposeFunction injects __pwUrlSync into window via CDP Runtime.addBinding.
    // It survives navigations — Playwright re-injects on every new document automatically.
    await page.exposeFunction('__pwUrlSync', (url: string) => {
        pushUrlToFirestore(tabId, userId, url);
    });

    // Why: init script runs before any page JS on every navigation (new document).
    // Patching pushState/replaceState here covers SPAs (React Router, Next.js, Vue Router).
    // hashchange covers anchor-link navigation and old-style hash-based routers.
    await page.addInitScript(`(function () {
        function notify() {
            if (typeof __pwUrlSync === 'function') __pwUrlSync(location.href);
        }
        var _push = history.pushState.bind(history);
        var _replace = history.replaceState.bind(history);
        history.pushState = function() { _push.apply(history, arguments); notify(); };
        history.replaceState = function() { _replace.apply(history, arguments); notify(); };
        window.addEventListener('hashchange', notify);
        window.addEventListener('popstate', notify);
        // Why: fire notify on DOMContentLoaded so full HTTP navigations (302 redirects,
        // SAML SSO, server-side redirects) also push the resolved URL to Firestore
        // without relying on a separate framenavigated handler.
        window.addEventListener('DOMContentLoaded', notify, { once: true });
    })();`);
}

/** Remove watcher state when a tab is closed — prevents memory leak on long-running containers. */
export function clearUrlWatcher(tabId: string): void {
    lastSyncedUrl.delete(tabId);
    const t = urlDebounceTimers.get(tabId);
    if (t) { clearTimeout(t); urlDebounceTimers.delete(tabId); }
}

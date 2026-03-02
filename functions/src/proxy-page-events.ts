// Feature: Page Event Listeners | Trace: README.md
import { Page, BrowserContext } from 'playwright';
import { isCdpMode } from './proxy-config';
import { syncSettledUrl } from './proxy-nav-controller';
import { saveSession } from './proxy-session.service';
import { captureAndSync } from './proxy-capture.service';
import { is2FAPage } from './proxy-stealth.config';
import { activePages, activeContexts, activeUserIds, closedTabs, redirectingTabs, redirectDebounceTimers } from './proxy-page-registry';

/**
 * Attach all lifetime event listeners to a page after creation.
 * Why: extracted from getPersistentPage to keep that function under 100 lines.
 */
export function attachPageEventListeners(page: Page, tabId: string, userId: string, context: BrowserContext): void {
    // Why: debounce redirect chains — natural JS/meta redirects fire multiple framenavigated events.
    // captureAndSync during a chain would snapshot an intermediate URL and write it to
    // Firestore, causing the frontend to re-navigate back — a redirect echo loop.
    page.on('framenavigated', (frame) => {
        if (frame !== page.mainFrame()) return;
        const url = frame.url();
        syncSettledUrl(tabId, url);
        // Why: 2FA/auth pages require human interaction for 45s+. Hold debounce for 60s.
        const debounceMs = is2FAPage(url) ? 60000 : 1500;
        console.debug(`[NavEvent] framenavigated tab=${tabId} url=${url} debounce=${debounceMs}ms${debounceMs === 60000 ? ' ⚠️2FA-PAGE' : ''}`);
        redirectingTabs.add(tabId);
        const existing = redirectDebounceTimers.get(tabId);
        if (existing) clearTimeout(existing);
        const timer = setTimeout(() => {
            redirectingTabs.delete(tabId);
            redirectDebounceTimers.delete(tabId);
            const p = activePages.get(tabId);
            const ctx = activeContexts.get(tabId);
            const uid = activeUserIds.get(tabId) || 'default';
            if (p && ctx && !closedTabs.has(tabId)) {
                console.debug(`[NavEvent] ✅ debounce cleared tab=${tabId} — triggering immediate capture`);
                captureAndSync(tabId, uid, p, ctx);
                if (!isCdpMode() && uid !== 'default') saveSession(uid, ctx).catch(() => {});
            }
        }, debounceMs);
        redirectDebounceTimers.set(tabId, timer);
    });
    if (isCdpMode()) return; // Chrome owns its own cookies in CDP mode — skip session saves
    // Why: save immediately when the server sets new cookies (login, consent, auth tokens)
    page.on('response', (response) => {
        if (response.headers()['set-cookie']) {
            console.debug(`[Session] 🍪 set-cookie detected on ${response.url()} — saving session for ${userId}`);
            saveSession(userId, context).catch(() => {});
        }
    });
    // Why: save on every full page load — covers SPAs that update localStorage after hydration
    page.on('load', () => {
        console.debug(`[Session] 📄 page load — saving session for ${userId} url=${page.url()}`);
        saveSession(userId, context).catch(() => {});
    });
}

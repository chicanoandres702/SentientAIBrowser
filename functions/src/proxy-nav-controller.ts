// Feature: Navigation | Why: Central nav guard — mutex + redirect tracking prevents loop storms
import { Page } from 'playwright';
import { db } from './proxy-config';

// Per-tab navigation lock — only one active page.goto at a time
const navLocks = new Map<string, boolean>();

// Per-tab last settled (final) URL after all redirects resolve
const settledUrls = new Map<string, string>();

export const isNavLocked = (tabId: string): boolean => navLocks.get(tabId) === true;
export const getSettledUrl = (tabId: string): string | undefined => settledUrls.get(tabId);
export const clearNav = (tabId: string): void => { navLocks.delete(tabId); settledUrls.delete(tabId); };

/**
 * Called by the page's framenavigated listener so settledUrls never goes stale
 * after a JS-redirect or CAPTCHA auto-continue that happens WITHOUT a page.goto call.
 */
export function syncSettledUrl(tabId: string, url: string): void {
    if (url && url !== 'about:blank' && url !== 'about:newtab') {
        settledUrls.set(tabId, url);
    }
}

// Why: These URL patterns are bot-check / human-verification gates.
// When we land on one we must pause execution and tell the user — NOT navigate away,
// which would restart the loop.
const BOT_CHECK_PATTERNS = [
    /google\.com\/sorry/,
    /google\.com\/recaptcha/,
    /accounts\.google\.com\/ServiceLogin/,
    /cloudflare\.com\/challenge/,
    /hcaptcha\.com/,
    /\/captcha\//,
    /\/challenge\//,
    /\/verify\//,
    /bot-check/,
];

export function isBotCheckUrl(url: string): boolean {
    return BOT_CHECK_PATTERNS.some(p => p.test(url));
}

/**
 * Navigate with lock + redirect resolution.
 * Why: raw page.goto has no mutex, so rapid calls from Firestore listener + LLM + user
 * create concurrent navigations that fight each other and cause redirect oscillation.
 *
 * After settling, writes source:'proxy' + finalUrl to Firestore so the Firestore
 * listener does NOT re-react to its own write (breaks the self-echo loop).
 */
export async function guardedNavigate(
    page: Page,
    tabId: string,
    targetUrl: string,
): Promise<{ finalUrl: string; wasRedirected: boolean; isBotCheck: boolean }> {
    // Lock held — drop duplicate; return current settled state
    if (navLocks.get(tabId)) {
        const url = settledUrls.get(tabId) || page.url();
        return { finalUrl: url, wasRedirected: false, isBotCheck: isBotCheckUrl(url) };
    }

    // Already at this exact destination — skip the goto entirely
    const currentUrl = page.url();
    if (currentUrl === targetUrl && settledUrls.get(tabId) === targetUrl) {
        return { finalUrl: targetUrl, wasRedirected: false, isBotCheck: isBotCheckUrl(targetUrl) };
    }

    // Why: if the page is currently stuck on a bot-check URL (e.g. Google /sorry/) and
    // the caller is trying to navigate TO THE SAME HOST again, refuse the navigation —
    // going there will just get bot-checked again and restart the loop.
    const currentBotCheck = isBotCheckUrl(currentUrl);
    if (currentBotCheck) {
        console.warn(`[NavCtrl] Bot-check detected on tab ${tabId}: ${currentUrl}. Refusing navigation to prevent loop.`);
        return { finalUrl: currentUrl, wasRedirected: true, isBotCheck: true };
    }

    navLocks.set(tabId, true);
    try {
        // Why: defensive guard — if the page was closed between the caller's isClosed check
        // and this point, abort cleanly instead of throwing a Playwright "Target closed" error.
        if (page.isClosed()) throw new Error('Page was closed before navigation could start');
        await page.setViewportSize({ width: 1280, height: 800 });
        await page
            .goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
            .catch(e => console.error(`[NavCtrl] goto error for ${tabId}:`, e.message));

        const finalUrl = page.url();
        const wasRedirected = finalUrl !== targetUrl;
        const botCheck = isBotCheckUrl(finalUrl);
        settledUrls.set(tabId, finalUrl);

        if (botCheck) {
            console.warn(`[NavCtrl] Bot-check after navigation on tab ${tabId}: ${finalUrl}`);
        } else if (wasRedirected) {
            console.log(`[NavCtrl] Redirect: ${targetUrl} → ${finalUrl} (tab: ${tabId})`);
        }

        // Write source:'proxy' so startFirestoreListener skips this update (self-echo guard)
        try {
            await db.collection('browser_tabs').doc(tabId).set(
                { url: finalUrl, source: 'proxy', last_sync: new Date().toISOString(), isBotCheck: botCheck },
                { merge: true },
            );
        } catch { /* Non-fatal: no credentials in local dev */ }

        return { finalUrl, wasRedirected, isBotCheck: botCheck };
    } finally {
        navLocks.delete(tabId);
    }
}

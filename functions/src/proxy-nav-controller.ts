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
        console.debug(`[NavCtrl] syncSettled tab=${tabId} url=${url}`);
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

// Why: Auth-wall patterns — pages that need human MFA/OTP/SAML completion.
// Executor MUST pause and yield to the user when it hits these — not loop.
const AUTH_WALL_PATTERNS = [
    /\/idp\/SSO\.saml2/i,       // SAML SP-initiated SSO
    /\/saml2?\//i,              // Generic SAML endpoints
    /pingid\/ppm\/auth/i,      // PingOne / PingID MFA
    /\/pingid\//i,              // Any PingID URL
    /\/mfa\//i,
    /\/otp\//i,
    /\/two-factor/i,
    /\/step-up/i,
    /\/oauth2?\/authorize/i,    // OAuth consent / login walls
    /\/sso\/saml/i,
    /login\.microsoftonline\.com/,
    /accounts\.google\.com\/signin/,
    /appleid\.apple\.com/,
];

export function isAuthWallUrl(url: string): boolean {
    return AUTH_WALL_PATTERNS.some(p => p.test(url));
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
        console.warn(`[NavCtrl] 🔒 lock held tab=${tabId} — dropping navigate to ${targetUrl}`);
        return { finalUrl: url, wasRedirected: false, isBotCheck: isBotCheckUrl(url) };
    }

    // Already at this exact destination — skip the goto entirely
    const currentUrl = page.url();
    if (currentUrl === targetUrl && settledUrls.get(tabId) === targetUrl) {
        console.debug(`[NavCtrl] ⏸️  skip — already at ${targetUrl}`);
        return { finalUrl: targetUrl, wasRedirected: false, isBotCheck: isBotCheckUrl(targetUrl) };
    }

    // Why: log bot-check but DON'T refuse — stealth headers may bypass it, and
    // refusing navigation stalls the mission permanently with no recovery path.
    if (isBotCheckUrl(currentUrl)) {
        console.warn(`[NavCtrl] Bot-check on tab ${tabId}: ${currentUrl} — proceeding with navigation attempt.`);
    }

    navLocks.set(tabId, true);
    console.log(`[NavCtrl] 🔓 lock acquired tab=${tabId} navigating ${currentUrl} → ${targetUrl}`);
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
        console.log(`[NavCtrl] 🏁 settled tab=${tabId} finalUrl=${finalUrl} redirected=${wasRedirected} botCheck=${botCheck}`);

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

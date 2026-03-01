// Feature: Navigation | Why: Frontend nav guard — resolves redirects before writing to Firestore
import { useCallback, useRef } from 'react';
import { auth } from '../features/auth/firebase-config';

interface NavResult {
    finalUrl: string;
    wasRedirected: boolean;
}

/**
 * Wraps navigation with redirect-awareness.
 *
 * Why this exists:
 *   Without this, the call chain is:
 *     navigateActiveTab(URL_A) → Firestore: {url: URL_A} → backend goto URL_A
 *     → redirect to URL_B → captureAndSync writes {url: URL_B}
 *     → frontend setActiveUrl(URL_B) → LLM sees URL_B but task says "go to URL_A"
 *     → LLM retries URL_A → LOOP
 *
 *   With this hook:
 *     navigateWithGuard(URL_A) → POST /proxy/navigate → backend resolves to URL_B
 *     → response: { finalUrl: URL_B } → navigateActiveTab(URL_B)
 *     → Firestore: {url: URL_B} → LLM sees URL_B → no retry loop ✓
 *
 * @param proxyBaseUrl   Cloud Run base URL
 * @param tabId          Active tab id
 * @param navigateTab    The raw navigateActiveTab from useBrowserTabs (called with finalUrl)
 */
export function useNavigationController(
    proxyBaseUrl: string,
    tabId: string,
    navigateTab: (url: string) => Promise<void>,
) {
    // Tracks the URL currently being resolved — prevents duplicate in-flight requests
    const pendingRef = useRef<string | null>(null);

    const navigateWithGuard = useCallback(async (targetUrl: string): Promise<void> => {
        // Drop if same navigation is already in flight
        if (pendingRef.current === targetUrl) return;

        // Fallback: no proxy configured — use raw navigation
        if (!proxyBaseUrl) {
            await navigateTab(targetUrl);
            return;
        }

        pendingRef.current = targetUrl;
        try {
            const res = await fetch(`${proxyBaseUrl}/proxy/navigate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: targetUrl, tabId, userId: auth.currentUser?.uid || '' }),
            });

            if (!res.ok) {
                // 409 = already navigating; wait and the Firestore listener will sync the result
                if (res.status !== 409) await navigateTab(targetUrl);
                return;
            }

            const { finalUrl, isBotCheck }: NavResult & { isBotCheck?: boolean } = await res.json();

            // Why: don't pause on bot-check — stealth headers may already bypass it and
            // refusing to write finalUrl desync the address bar from the real page.
            if (isBotCheck) {
                console.warn('[NavCtrl] Bot-check detected — updating URL and continuing:', finalUrl);
            }

            // Write the RESOLVED URL — not the originally requested URL
            // This is what breaks the LLM retry loop
            await navigateTab(finalUrl);
        } catch (e) {
            console.warn('[NavCtrl] navigate error, falling back:', e);
            await navigateTab(targetUrl);
        } finally {
            pendingRef.current = null;
        }
    }, [proxyBaseUrl, tabId, navigateTab]);

    return { navigateWithGuard };
}

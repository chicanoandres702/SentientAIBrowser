// Feature: Browser | Why: Proxy communication isolated so BrowserPreview stays UI-focused
import { getEnvConfig } from '../../../../shared/env.utils';

const PROXY_BASE = getEnvConfig().proxyBaseUrl;

/** Timeout for health-check pings */
const HEALTH_TIMEOUT_MS = 4000;

/** Pings the proxy /health endpoint to confirm it is reachable */
export async function checkProxyHealth(): Promise<{
    ok: boolean;
    activeTabs: string[];
}> {
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
        const res = await fetch(`${PROXY_BASE}/health`, { signal: controller.signal });
        clearTimeout(timer);

        if (!res.ok) return { ok: false, activeTabs: [] };

        const body = await res.json();
        return { ok: body.status === 'ok', activeTabs: body.activeTabs || [] };
    } catch {
        return { ok: false, activeTabs: [] };
    }
}

/** Fetches a screenshot directly from the proxy (bypasses Firestore) */
export async function fetchDirectScreenshot(tabId: string): Promise<string | null> {
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(
            `${PROXY_BASE}/screenshot?tabId=${encodeURIComponent(tabId)}`,
            { signal: controller.signal },
        );
        clearTimeout(timer);

        if (!res.ok) return null;
        const body = await res.json();
        return body.screenshot || null;
    } catch {
        return null;
    }
}

export { PROXY_BASE };

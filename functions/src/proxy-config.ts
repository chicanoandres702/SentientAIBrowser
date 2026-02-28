// Feature: System Utilities | Trace: README.md
// Technique: browser-use/web-ui — named Chrome arg constants + port conflict detection (BrowserConfig)
import * as net from 'net';
import { chromium, Browser } from 'playwright';
import { db, auth } from './auth/firebase-config';

export { db, auth };

// Cloud Run injects PORT env var. Fallback to 3000 for local dev.
export const PORT = parseInt(process.env.PORT || '3000', 10);

/**
 * Chrome args required for running headless in sandboxed/container environments.
 * Separated by concern so they can be selectively included or overridden.
 * Technique: browser-use/web-ui BrowserConfig chromium_args pattern.
 */
export const CHROME_SANDBOX_ARGS = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',   // use /tmp instead of /dev/shm (limited in containers)
    '--no-zygote',               // required with --single-process in containers
] as const;

export const CHROME_PERF_ARGS = [
    '--disable-gpu',
    '--single-process',          // reduce memory footprint
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-default-apps',
    '--disable-sync',
    '--disable-translate',
    '--mute-audio',
] as const;

/** Anti-fingerprinting args — from browser-use/web-ui stealth patterns */
export const CHROME_STEALTH_ARGS = [
    '--disable-blink-features=AutomationControlled',
    '--disable-infobars',
    '--window-size=1280,800',
    '--disable-web-security',         // allow cross-origin iframes
    '--ignore-certificate-errors',
] as const;

export const CHROME_DEFAULT_ARGS = [
    ...CHROME_SANDBOX_ARGS,
    ...CHROME_PERF_ARGS,
    ...CHROME_STEALTH_ARGS,
] as const;

/** Remote debugging port used when connecting to an existing browser instance */
export const REMOTE_DEBUGGING_PORT = 9222;

/**
 * Checks whether a TCP port is already in use.
 * Technique: browser-use/web-ui — port conflict detection before launching custom browser.
 */
export function isPortInUse(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', (err: NodeJS.ErrnoException) => {
            resolve(err.code === 'EADDRINUSE');
        });
        server.once('listening', () => {
            server.close();
            resolve(false);
        });
        server.listen(port, '127.0.0.1');
    });
}

let browserInstance: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
    if (!browserInstance || !browserInstance.isConnected()) {
        // --- browser-use/web-ui: connect to existing browser if remote debug port active ---
        const debugPortActive = await isPortInUse(REMOTE_DEBUGGING_PORT);
        if (debugPortActive) {
            try {
                browserInstance = await chromium.connectOverCDP(`http://127.0.0.1:${REMOTE_DEBUGGING_PORT}`);
                console.log(`[Proxy] Connected to existing browser on port ${REMOTE_DEBUGGING_PORT}`);
                return browserInstance;
            } catch (e: any) {
                console.warn('[Proxy] CDP connect failed, launching new browser:', e.message);
            }
        }

        browserInstance = await chromium.launch({
            headless: true,
            args: [...CHROME_DEFAULT_ARGS],
        });
        console.log('[Proxy] Browser launched successfully');
    }
    return browserInstance;
}

export function stripSecurityHeaders(res: any) {
  res.removeHeader('X-Frame-Options');
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('Content-Security-Policy-Report-Only');
  res.removeHeader('X-Content-Type-Options');
}

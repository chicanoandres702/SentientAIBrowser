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
    '--no-zygote',               // Docker containers lack the Linux capabilities the zygote needs
] as const;

export const CHROME_PERF_ARGS = [
    '--disable-gpu',
    // Why: --single-process was removed — it collapses renderer+browser into one OS process,
    // causing 'Target page, context or browser has been closed' crashes when creating
    // new BrowserContexts. Multi-process mode is stable with --no-zygote + --no-sandbox.
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-default-apps',
    '--disable-sync',
    '--disable-translate',
    '--mute-audio',
] as const;

/** Remote debugging port — must be declared before CHROME_STEALTH_ARGS uses it */
export const REMOTE_DEBUGGING_PORT = 9222;

/** Anti-fingerprinting args — from browser-use/web-ui stealth patterns */
export const CHROME_STEALTH_ARGS = [
    '--disable-blink-features=AutomationControlled',
    '--disable-infobars',
    '--window-size=1280,800',
    '--disable-web-security',         // allow cross-origin iframes
    '--ignore-certificate-errors',
    `--remote-debugging-port=${REMOTE_DEBUGGING_PORT}`, // Why: expose CDP so humans can connect via DevTools
] as const;

export const CHROME_DEFAULT_ARGS = [
    ...CHROME_SANDBOX_ARGS,
    ...CHROME_PERF_ARGS,
    ...CHROME_STEALTH_ARGS,
] as const;

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
// Why: Launch lock prevents concurrent requests from each spawning a Chrome process.
// Without this, two simultaneous calls while browserInstance=null both try chromium.launch()
// and the second Chrome fails to bind --remote-debugging-port=9222 → 180s timeout → proxy down.
let launchInProgress: Promise<Browser> | null = null;

export async function getBrowser(): Promise<Browser> {
    if (browserInstance?.isConnected()) return browserInstance;

    // If a launch is already in flight, wait for it instead of starting another
    if (launchInProgress) return launchInProgress;

    launchInProgress = (async () => {
        try {
            browserInstance = await chromium.launch({
                headless: true,
                args: [...CHROME_DEFAULT_ARGS],
            });
            console.log('[Proxy] Browser launched successfully');
            return browserInstance;
        } finally {
            launchInProgress = null; // Release lock whether launch succeeded or failed
        }
    })();

    return launchInProgress;
}

export function stripSecurityHeaders(res: any) {
  res.removeHeader('X-Frame-Options');
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('Content-Security-Policy-Report-Only');
  res.removeHeader('X-Content-Type-Options');
}

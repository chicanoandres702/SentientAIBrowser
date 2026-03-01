// Feature: Page Lifecycle | Trace: README.md
import { getBrowser, db } from './proxy-config';
import { BLOCKED_EXTENSIONS } from './proxy-asset';
import { Page, BrowserContext } from 'playwright';
import { guardedNavigate, syncSettledUrl } from './proxy-nav-controller';

export const activeContexts = new Map<string, BrowserContext>();
export const activePages = new Map<string, Page>();
// Why: store interval IDs so closePage can clear them — prevents ghost re-creation of closed tabs
const syncIntervals = new Map<string, ReturnType<typeof setInterval>>();
let firestoreAvailable = true;

// Why: Stealth headers — make Playwright look like a real Chrome user.
// Without these, Google/Cloudflare instantly detect navigator.webdriver and show CAPTCHAs.
const STEALTH_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const STEALTH_INIT_SCRIPT = `
  Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
  Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
  Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
  window.chrome = { runtime: {} };
`;

async function setupRequestBlocking(page: Page) {
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (BLOCKED_EXTENSIONS.some(ext => url.endsWith(ext))) route.abort();
    else route.continue();
  });
}

async function captureAndSync(tabId: string, userId: string, page: Page, context: BrowserContext) {
  if (!firestoreAvailable) return;
  // Why: never broadcast about:blank — prevents overwriting a real URL with a transitional blank state
  const currentUrl = page.url();
  if (!currentUrl || currentUrl === 'about:blank' || currentUrl === 'about:newtab') return;
  try {
    const screenshot = (await page.screenshot({ quality: 60, type: 'jpeg' })).toString('base64');
    await db.collection('browser_tabs').doc(tabId).set({
      screenshot: `data:image/jpeg;base64,${screenshot}`,
      url: page.url(), title: (await page.title()) || 'Loading...',
      source: 'proxy', // Why: signals the listener to skip — breaks self-echo loop
      last_sync: new Date().toISOString()
    }, { merge: true });
  } catch (e: any) { 
    if (e.message.includes('credentials') || e.message.includes('Could not load the default')) {
      firestoreAvailable = false;
      console.warn(`[Proxy] Firestore sync disabled (no credentials). Screenshots available via /screenshot route.`);
    } else if (!e.message.includes('Target closed') && !e.message.includes('Execution context was destroyed')) {
      console.error(`[Proxy] Sync failed:`, e.message); 
    }
  }
}

export async function getPersistentPage(targetUrl: string | null, tabId: string, userId: string = 'default') {
  const browser = await getBrowser();
  let page = activePages.get(tabId);
  // Why: evict stale closed pages — prevents "Target page, context or browser has been closed"
  // errors when Playwright kills a page (e.g. after a crash or idle timeout) but the map
  // still holds the dead reference.
  if (page && page.isClosed()) {
    closePage(tabId);
    page = undefined;
  }
  if (!page) {
    const context = await browser.newContext({
      userAgent: STEALTH_UA,
      viewport: { width: 1280, height: 800 },
      locale: 'en-US',
      timezoneId: 'America/New_York',
      extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
    });
    // Why: hide navigator.webdriver + add fake plugin/language signals before any page script runs
    await context.addInitScript(STEALTH_INIT_SCRIPT);
    page = await context.newPage();
    await setupRequestBlocking(page);
    activePages.set(tabId, page);
    activeContexts.set(tabId, context);
    // Why: keep settledUrls current for navigations the PAGE triggers itself (JS redirects,
    // meta-refresh, CAPTCHA auto-continue) — without this the dedup check in guardedNavigate
    // stays stale and re-navigates back into a bot-check loop.
    page.on('framenavigated', (frame) => {
      if (frame === page!.mainFrame()) syncSettledUrl(tabId, frame.url());
    });
    const interval = setInterval(() => captureAndSync(tabId, userId, page!, context), 5000);
    syncIntervals.set(tabId, interval);
  }
  const currentUrl = page.url();
  if (targetUrl && (currentUrl === 'about:blank' || (!currentUrl.includes(targetUrl) && !targetUrl.includes(currentUrl)))) {
    // Why: guardedNavigate provides mutex + redirect resolution; captureAndSync adds screenshot
    await guardedNavigate(page, tabId, targetUrl);
    await captureAndSync(tabId, userId, page, activeContexts.get(tabId)!);
  }
  return page;
}

export function closePage(id: string) {
    if (syncIntervals.has(id)) {
        clearInterval(syncIntervals.get(id)!);
        syncIntervals.delete(id);
    }
    if (activePages.has(id)) {
        activePages.get(id)!.close().catch(() => {});
        activePages.delete(id);
    }
    if (activeContexts.has(id)) {
        activeContexts.get(id)!.close().catch(() => {});
        activeContexts.delete(id);
    }
}

/**
 * Publicly trigger an immediate captureAndSync for a tab.
 * Why: click/action routes call this after user interactions so Firestore reflects the
 * new URL/screenshot without waiting for the 5-second periodic interval.
 */
export async function captureAndSyncTab(tabId: string): Promise<void> {
    const page = activePages.get(tabId);
    const context = activeContexts.get(tabId);
    if (!page || !context) return;
    await captureAndSync(tabId, 'default', page, context);
}

// Why: Playwright is the central command center.
// Navigation is driven exclusively by direct API calls (POST /proxy/navigate, etc.).
// Firestore is write-only from this process — used to broadcast state to the frontend.
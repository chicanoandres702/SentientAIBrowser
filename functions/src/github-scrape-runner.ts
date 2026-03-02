// Feature: GitHub Actions Scrape Runner | Trace: .github/workflows/playwright-scrape.yml
// Why: Standalone script executed by the GitHub Actions runner. Reads SCRAPE_* env vars,
//      launches Playwright headless Chromium, captures screenshot + title, and writes
//      the result to Firestore so the Android app can display it in real-time.
//      Must stay standalone — no imports from the proxy server module graph.
import * as admin from 'firebase-admin';
import { chromium } from 'playwright';

const STEALTH_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function initFirestore(): admin.firestore.Firestore {
  const raw = process.env.FIREBASE_SA_JSON ?? '';
  if (!raw) throw new Error('FIREBASE_SA_JSON env var is required');
  // Why: support both raw JSON and base64-encoded JSON stored as GitHub secret
  const json = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf-8');
  const sa = JSON.parse(json);
  admin.initializeApp({ credential: admin.credential.cert(sa) });
  return admin.firestore();
}

async function run(): Promise<void> {
  const url     = process.env.SCRAPE_URL    ?? '';
  const tabId   = process.env.SCRAPE_TAB_ID ?? `gh_${Date.now()}`;
  const userId  = process.env.SCRAPE_USER_ID ?? 'default';

  if (!url) throw new Error('SCRAPE_URL env var is required');

  const db = initFirestore();
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  try {
    const context = await browser.newContext({
      userAgent: STEALTH_UA,
      viewport: { width: 1280, height: 800 },
      locale: 'en-US',
    });
    // Why: mask navigator.webdriver so basic bot-detection doesn't block us
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    const page = await context.newPage();
    await page.route('**/*', (route) => {
      // Why: skip binary assets — we only need DOM + text, not images/fonts
      const u = route.request().url();
      if (/\.(png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot|mp4|webm)$/i.test(u)) route.abort();
      else route.continue();
    });

    console.log(`[GHScrape] Navigating to ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(1500); // Why: let JS-heavy pages settle after DOMContentLoaded

    const title      = (await page.title()) || 'Untitled';
    const screenshot = (await page.screenshot({ type: 'jpeg', quality: 65, timeout: 10_000 })).toString('base64');

    console.log(`[GHScrape] Writing to Firestore browser_tabs/${tabId}`);
    await db.collection('browser_tabs').doc(tabId).set({
      id: tabId,
      url,
      title,
      screenshot: `data:image/jpeg;base64,${screenshot}`,
      source: 'github-actions',
      ...(userId !== 'default' ? { user_id: userId } : {}),
      last_sync: new Date().toISOString(),
    }, { merge: true });

    console.log(`[GHScrape] ✅ Done — tab=${tabId} title="${title}"`);
  } finally {
    await browser.close();
  }
}

run().catch((e) => { console.error('[GHScrape] ❌', e.message); process.exit(1); });

// Feature: Page Lifecycle | Trace: README.md
import { getBrowser, db } from './proxy-config';
import { BLOCKED_EXTENSIONS } from './proxy-asset';
import { Page, BrowserContext } from 'playwright';

export const activeContexts = new Map<string, BrowserContext>();
export const activePages = new Map<string, Page>();
let isListening = false;
let firestoreAvailable = true;

async function setupRequestBlocking(page: Page) {
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (BLOCKED_EXTENSIONS.some(ext => url.endsWith(ext))) route.abort();
    else route.continue();
  });
}

async function captureAndSync(tabId: string, userId: string, page: Page, context: BrowserContext) {
  if (!firestoreAvailable) return;
  try {
    const screenshot = (await page.screenshot({ quality: 60, type: 'jpeg' })).toString('base64');
    await db.collection('browser_tabs').doc(tabId).set({
      screenshot: `data:image/jpeg;base64,${screenshot}`,
      url: page.url(), title: (await page.title()) || 'Loading...',
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
  if (!page) {
    // Session loading logic removed for local stability if proxy-session.service is missing
    const context = await browser.newContext();
    page = await context.newPage();
    await setupRequestBlocking(page);
    activePages.set(tabId, page); 
    activeContexts.set(tabId, context);
    setInterval(() => captureAndSync(tabId, userId, page!, context), 5000);
  }
  const currentUrl = page.url();
  if (targetUrl && (currentUrl === 'about:blank' || (!currentUrl.includes(targetUrl) && !targetUrl.includes(currentUrl)))) {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => console.error(e));
    await captureAndSync(tabId, userId, page, activeContexts.get(tabId)!);
  }
  return page;
}

export function startFirestoreListener() {
  if (isListening || !firestoreAvailable) return;
  isListening = true;
  try {
    db.collection('browser_tabs').onSnapshot((snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const data = change.doc.data(), tabId = change.doc.id, page = activePages.get(tabId);
          const currentUrl = page ? page.url() : 'about:blank';
          if (data.url && data.url !== currentUrl && !currentUrl.includes(data.url) && !data.url.includes(currentUrl)) {
            await getPersistentPage(data.url, tabId, data.userId);
          }
        }
      });
    }, (error) => {
      if (error.message?.includes('credentials') || error.message?.includes('Could not load the default')) {
        firestoreAvailable = false;
        console.warn(`[Proxy] Firestore listener disabled (no credentials). Direct routes still work.`);
      } else {
        console.error(`[Proxy] Firestore listener error:`, error);
      }
    });
  } catch (e: any) {
    firestoreAvailable = false;
    console.warn(`[Proxy] Firestore listener could not start (${e.message}). Direct routes still work.`);
  }
}

export function closePage(id: string) {
    if (activePages.has(id)) {
        activePages.get(id)!.close();
        activePages.delete(id);
    }
}

// Start Firestore listener if credentials are available; degrade gracefully otherwise
try {
  startFirestoreListener();
} catch (e: any) {
  console.warn(`[Proxy] Firestore listener skipped (${e.message}). Direct /screenshot route still works.`);
}
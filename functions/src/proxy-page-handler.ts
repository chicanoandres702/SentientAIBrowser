// Feature: System Utilities | Trace: proxy-routes-browser.js
import { getBrowser, db } from './proxy-config';
import { BLOCKED_EXTENSIONS } from './proxy-asset';
import { collection, query, onSnapshot, doc, updateDoc, serverTimestamp, DocumentData, QuerySnapshot } from 'firebase/firestore';
import { loadSession, saveSession } from './proxy-session.service';
import { Page, BrowserContext } from 'playwright';

export const activeContexts = new Map<string, BrowserContext>();
export const activePages = new Map<string, Page>();
let isListening = false;

async function setupRequestBlocking(page: Page) {
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (BLOCKED_EXTENSIONS.some(ext => url.endsWith(ext))) route.abort();
    else route.continue();
  });
}

async function captureAndSync(tabId: string, userId: string, page: Page, context: BrowserContext) {
  try {
    const screenshot = await page.screenshot({ encoding: 'base64', quality: 60, type: 'jpeg' });
    await updateDoc(doc(db, 'browser_tabs', tabId), {
      screenshot: `data:image/jpeg;base64,${screenshot}`,
      url: page.url(), title: (await page.title()) || 'Loading...',
      last_sync: serverTimestamp()
    });
    // Session saving logic removed for local stability if proxy-session.service is missing
    // await saveSession(userId, context);
  } catch (e: any) { 
    if (!e.message.includes('Target closed') && !e.message.includes('Execution context was destroyed')) {
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
  if (isListening) return;
  isListening = true;
  onSnapshot(query(collection(db, 'browser_tabs')), (snapshot: QuerySnapshot<DocumentData>) => {
    snapshot.docChanges().forEach(async (change) => {
      if (change.type === 'added' || change.type === 'modified') {
        const data = change.doc.data(), tabId = change.doc.id, page = activePages.get(tabId);
        const currentUrl = page ? page.url() : 'about:blank';
        if (data.url && data.url !== currentUrl && !currentUrl.includes(data.url) && !data.url.includes(currentUrl)) {
          await getPersistentPage(data.url, tabId, data.userId);
        }
      }
    });
  });
}

export function closePage(id: string) {
    if (activePages.has(id)) {
        activePages.get(id)!.close();
        activePages.delete(id);
    }
}

startFirestoreListener();
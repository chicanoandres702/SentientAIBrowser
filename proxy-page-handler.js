// Feature: System Utilities | Trace: proxy-routes-browser.js
const { getBrowser, db } = require('./proxy-config');
const { BLOCKED_EXTENSIONS } = require('./proxy-asset');
const { collection, query, onSnapshot, doc, updateDoc, serverTimestamp, getDoc, setDoc } = require('firebase/firestore');

const activeContexts = new Map();
const activePages = new Map();
let isListening = false;

async function loadSession(userId) {
  try {
    const sessionRef = doc(db, 'user_sessions', userId);
    const sessionSnap = await getDoc(sessionRef);
    if (sessionSnap.exists()) {
      return sessionSnap.data().storageState;
    }
  } catch (e) {
    console.error(`[Proxy] Failed to load session for ${userId}:`, e.message);
  }
  return null;
}

async function saveSession(userId, context) {
  try {
    const storageState = await context.storageState();
    const sessionRef = doc(db, 'user_sessions', userId);
    await setDoc(sessionRef, {
      storageState,
      updated_at: serverTimestamp()
    });
  } catch (e) {
    console.error(`[Proxy] Failed to save session for ${userId}:`, e.message);
  }
}

async function setupRequestBlocking(page) {
  await page.route('**/*', (route) => {
    const url = route.request().url();
    const isBlocked = BLOCKED_EXTENSIONS.some(ext => url.endsWith(ext));
    if (isBlocked) route.abort();
    else route.continue();
  });
}

async function captureAndSync(tabId, userId, page, context) {
  try {
    const screenshot = await page.screenshot({ encoding: 'base64', quality: 60, type: 'jpeg' });
    const url = page.url();
    const title = await page.title();
    
    const tabRef = doc(db, 'browser_tabs', tabId);
    await updateDoc(tabRef, {
      screenshot: `data:image/jpeg;base64,${screenshot}`,
      url,
      title: title || 'Loading...',
      last_sync: serverTimestamp()
    });

    // Periodically save storage state (cookies/localstorage)
    await saveSession(userId, context);
  } catch (e) { 
    if (!e.message.includes('Target closed') && !e.message.includes('Execution context was destroyed')) {
      console.error(`[Proxy] Sync failed for ${tabId}:`, e.message); 
    }
  }
}

async function getPersistentPage(targetUrl, tabId, userId) {
  const browser = await getBrowser();
  let page = activePages.get(tabId);
  
  if (!page) {
    console.log(`[Proxy] Creating new context for user ${userId} / tab ${tabId}`);
    const storageState = await loadSession(userId);
    const context = await browser.newContext({ storageState });
    
    page = await context.newPage();
    await setupRequestBlocking(page);
    
    activePages.set(tabId, page);
    activeContexts.set(tabId, context);
    
    setInterval(() => captureAndSync(tabId, userId, page, context), 5000);
  }
  
  const pageContext = activeContexts.get(tabId);
  const currentUrl = page.url();
  
  if (currentUrl === 'about:blank' || (!currentUrl.includes(targetUrl) && !targetUrl.includes(currentUrl))) {
    console.log(`[Proxy] Navigating ${tabId} to ${targetUrl}`);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => console.error(e));
    await captureAndSync(tabId, userId, page, pageContext);
  }
  return page;
}

function startFirestoreListener() {
  if (isListening) return;
  isListening = true;
  console.log('[Proxy] Starting Firestore Tab Listener...');
  
  const q = query(collection(db, 'browser_tabs'));
  onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      if (change.type === 'added' || change.type === 'modified') {
        const data = change.doc.data();
        const tabId = change.doc.id;
        
        // Why: Only navigate if the URL in Firestore is explicitly changed and different from current.
        // We use a small buffer to avoid loops if URL normalization is inconsistent.
        const page = activePages.get(tabId);
        const currentUrl = page ? page.url() : 'about:blank';
        
        if (data.url && data.url !== currentUrl && !currentUrl.includes(data.url) && !data.url.includes(currentUrl)) {
          await getPersistentPage(data.url, tabId);
        }
      }
    });
  });
}

// Initialize listener
startFirestoreListener();

async function closePage(tabId) { 
  if (activePages.has(tabId)) { 
    await activePages.get(tabId).close(); 
    activePages.delete(tabId); 
  } 
}

module.exports = { getPersistentPage, closePage, activePages };
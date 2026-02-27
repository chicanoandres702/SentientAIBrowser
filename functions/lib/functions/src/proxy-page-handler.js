"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activePages = exports.activeContexts = void 0;
exports.getPersistentPage = getPersistentPage;
exports.startFirestoreListener = startFirestoreListener;
exports.closePage = closePage;
// Feature: System Utilities | Trace: proxy-routes-browser.js
const proxy_config_1 = require("./proxy-config");
const proxy_asset_1 = require("./proxy-asset");
const firestore_1 = require("firebase/firestore");
exports.activeContexts = new Map();
exports.activePages = new Map();
let isListening = false;
async function setupRequestBlocking(page) {
    await page.route('**/*', (route) => {
        const url = route.request().url();
        if (proxy_asset_1.BLOCKED_EXTENSIONS.some(ext => url.endsWith(ext)))
            route.abort();
        else
            route.continue();
    });
}
async function captureAndSync(tabId, userId, page, context) {
    try {
        const screenshot = await page.screenshot({ encoding: 'base64', quality: 60, type: 'jpeg' });
        await (0, firestore_1.updateDoc)((0, firestore_1.doc)(proxy_config_1.db, 'browser_tabs', tabId), {
            screenshot: `data:image/jpeg;base64,${screenshot}`,
            url: page.url(), title: (await page.title()) || 'Loading...',
            last_sync: (0, firestore_1.serverTimestamp)()
        });
        // Session saving logic removed for local stability if proxy-session.service is missing
        // await saveSession(userId, context);
    }
    catch (e) {
        if (!e.message.includes('Target closed') && !e.message.includes('Execution context was destroyed')) {
            console.error(`[Proxy] Sync failed:`, e.message);
        }
    }
}
async function getPersistentPage(targetUrl, tabId, userId = 'default') {
    const browser = await (0, proxy_config_1.getBrowser)();
    let page = exports.activePages.get(tabId);
    if (!page) {
        // Session loading logic removed for local stability if proxy-session.service is missing
        const context = await browser.newContext();
        page = await context.newPage();
        await setupRequestBlocking(page);
        exports.activePages.set(tabId, page);
        exports.activeContexts.set(tabId, context);
        setInterval(() => captureAndSync(tabId, userId, page, context), 5000);
    }
    const currentUrl = page.url();
    if (targetUrl && (currentUrl === 'about:blank' || (!currentUrl.includes(targetUrl) && !targetUrl.includes(currentUrl)))) {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => console.error(e));
        await captureAndSync(tabId, userId, page, exports.activeContexts.get(tabId));
    }
    return page;
}
function startFirestoreListener() {
    if (isListening)
        return;
    isListening = true;
    (0, firestore_1.onSnapshot)((0, firestore_1.query)((0, firestore_1.collection)(proxy_config_1.db, 'browser_tabs')), (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'added' || change.type === 'modified') {
                const data = change.doc.data(), tabId = change.doc.id, page = exports.activePages.get(tabId);
                const currentUrl = page ? page.url() : 'about:blank';
                if (data.url && data.url !== currentUrl && !currentUrl.includes(data.url) && !data.url.includes(currentUrl)) {
                    await getPersistentPage(data.url, tabId, data.userId);
                }
            }
        });
    });
}
function closePage(id) {
    if (exports.activePages.has(id)) {
        exports.activePages.get(id).close();
        exports.activePages.delete(id);
    }
}
startFirestoreListener();
//# sourceMappingURL=proxy-page-handler.js.map
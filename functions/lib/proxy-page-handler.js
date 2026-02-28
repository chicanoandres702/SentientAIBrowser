"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activePages = exports.activeContexts = void 0;
exports.getPersistentPage = getPersistentPage;
exports.startFirestoreListener = startFirestoreListener;
exports.closePage = closePage;
const proxy_config_1 = require("./proxy-config");
const proxy_asset_1 = require("./proxy-asset");
exports.activeContexts = new Map();
exports.activePages = new Map();
let isListening = false;
let firestoreAvailable = true;
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
    if (!firestoreAvailable)
        return;
    try {
        const screenshot = (await page.screenshot({ quality: 60, type: 'jpeg' })).toString('base64');
        await proxy_config_1.db.collection('browser_tabs').doc(tabId).set({
            screenshot: `data:image/jpeg;base64,${screenshot}`,
            url: page.url(), title: (await page.title()) || 'Loading...',
            last_sync: new Date().toISOString()
        }, { merge: true });
    }
    catch (e) {
        if (e.message.includes('credentials') || e.message.includes('Could not load the default')) {
            firestoreAvailable = false;
            console.warn(`[Proxy] Firestore sync disabled (no credentials). Screenshots available via /screenshot route.`);
        }
        else if (!e.message.includes('Target closed') && !e.message.includes('Execution context was destroyed')) {
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
    if (isListening || !firestoreAvailable)
        return;
    isListening = true;
    try {
        proxy_config_1.db.collection('browser_tabs').onSnapshot((snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                if (change.type === 'added' || change.type === 'modified') {
                    const data = change.doc.data(), tabId = change.doc.id, page = exports.activePages.get(tabId);
                    const currentUrl = page ? page.url() : 'about:blank';
                    if (data.url && data.url !== currentUrl && !currentUrl.includes(data.url) && !data.url.includes(currentUrl)) {
                        await getPersistentPage(data.url, tabId, data.userId);
                    }
                }
            });
        }, (error) => {
            var _a, _b;
            if (((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('credentials')) || ((_b = error.message) === null || _b === void 0 ? void 0 : _b.includes('Could not load the default'))) {
                firestoreAvailable = false;
                console.warn(`[Proxy] Firestore listener disabled (no credentials). Direct routes still work.`);
            }
            else {
                console.error(`[Proxy] Firestore listener error:`, error);
            }
        });
    }
    catch (e) {
        firestoreAvailable = false;
        console.warn(`[Proxy] Firestore listener could not start (${e.message}). Direct routes still work.`);
    }
}
function closePage(id) {
    if (exports.activePages.has(id)) {
        exports.activePages.get(id).close();
        exports.activePages.delete(id);
    }
}
// Start Firestore listener if credentials are available; degrade gracefully otherwise
try {
    startFirestoreListener();
}
catch (e) {
    console.warn(`[Proxy] Firestore listener skipped (${e.message}). Direct /screenshot route still works.`);
}
//# sourceMappingURL=proxy-page-handler.js.map
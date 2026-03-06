"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Sentient File Header
 * Why: GitHub Actions scrape runner for Sentient AI Browser
 * Filepath: functions/src/github-scrape-runner.ts
 * Description: Standalone script for Playwright scraping, writes results to Firestore
 * Trace: Used by CI/CD, Android app, and orchestrator
 * Wiring: Standalone script, executed by GitHub Actions runner
 */
// Feature: GitHub Actions Scrape Runner | Trace: .github/workflows/playwright-scrape.yml
// Why: Standalone script executed by the GitHub Actions runner. Reads SCRAPE_* env vars,
//      launches Playwright headless Chromium, captures screenshot + title, and writes
//      the result to Firestore so the Android app can display it in real-time.
//      Must stay standalone — no imports from the proxy server module graph.
const admin = __importStar(require("firebase-admin"));
const playwright_1 = require("playwright");
const STEALTH_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
function initFirestore() {
    var _a;
    const raw = (_a = process.env.FIREBASE_SA_JSON) !== null && _a !== void 0 ? _a : '';
    if (!raw)
        throw new Error('FIREBASE_SA_JSON env var is required');
    // Why: support both raw JSON and base64-encoded JSON stored as GitHub secret
    const json = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf-8');
    const sa = JSON.parse(json);
    admin.initializeApp({ credential: admin.credential.cert(sa) });
    return admin.firestore();
}
async function run() {
    var _a, _b, _c;
    const url = (_a = process.env.SCRAPE_URL) !== null && _a !== void 0 ? _a : '';
    const tabId = (_b = process.env.SCRAPE_TAB_ID) !== null && _b !== void 0 ? _b : `gh_${Date.now()}`;
    const userId = (_c = process.env.SCRAPE_USER_ID) !== null && _c !== void 0 ? _c : 'default';
    if (!url)
        throw new Error('SCRAPE_URL env var is required');
    const db = initFirestore();
    const browser = await playwright_1.chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
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
            if (/\.(png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot|mp4|webm)$/i.test(u))
                route.abort();
            else
                route.continue();
        });
        console.log(`[GHScrape] Navigating to ${url}`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(1500); // Why: let JS-heavy pages settle after DOMContentLoaded
        const title = (await page.title()) || 'Untitled';
        const screenshot = (await page.screenshot({ type: 'jpeg', quality: 65, timeout: 10000 })).toString('base64');
        console.log(`[GHScrape] Writing to Firestore browser_tabs/${tabId}`);
        await db.collection('browser_tabs').doc(tabId).set(Object.assign(Object.assign({ id: tabId, url,
            title, screenshot: `data:image/jpeg;base64,${screenshot}`, source: 'github-actions' }, (userId !== 'default' ? { user_id: userId } : {})), { last_sync: new Date().toISOString() }), { merge: true });
        console.log(`[GHScrape] ✅ Done — tab=${tabId} title="${title}"`);
    }
    finally {
        await browser.close();
    }
}
run().catch((e) => { console.error('[GHScrape] ❌', e.message); process.exit(1); });
//# sourceMappingURL=github-scrape-runner.js.map
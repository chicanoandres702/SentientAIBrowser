// Feature: Background Worker | Trace: .agents/workflows/worker-optimization.md
const { parentPort, workerData } = require('worker_threads');
const { chromium } = require('playwright');
const axios = require('axios');

/**
 * Sentient High-Fidelity Worker Thread - Playwright Edition
 * Handles heavy scraping and isolated network requests.
 */
async function executeTask({ type, payload }) {
    let browser;
    try {
        switch (type) {
            case 'SCRAPE':
                browser = await chromium.launch({ headless: true });
                const context = await browser.newContext({
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
                });
                const page = await context.newPage();
                await page.goto(payload.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
                const data = await page.content();
                return { data };
            
            case 'ACTION':
                browser = await chromium.launch({ headless: true });
                const actionContext = await browser.newContext();
                const actionPage = await actionContext.newPage();
                await actionPage.goto(payload.url, { waitUntil: 'networkidle', timeout: 30000 });
                const selector = `[data-ai-id="${payload.id}"]`;
                if (payload.action === 'click') await actionPage.click(selector);
                else if (payload.action === 'type') await actionPage.fill(selector, payload.value || '');
                return { success: true };

            case 'SCREENSHOT':
                browser = await chromium.launch({ headless: true });
                const ssContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
                const ssPage = await ssContext.newPage();
                await ssPage.goto(payload.url, { waitUntil: 'networkidle', timeout: 30000 });
                const screenshot = await ssPage.screenshot({ type: 'png', scale: 'css' });
                return { screenshot: `data:image/png;base64,${screenshot.toString('base64')}` };

            case 'AXIOS':
                const response = await axios({ ...payload, timeout: 30000 });
                return { data: response.data, status: response.status };

            default:
                throw new Error(`Unknown task type: ${type}`);
        }
    } finally {
        if (browser) await browser.close();
    }
}

(async () => {
    try {
        const result = await executeTask(workerData);
        parentPort.postMessage({ success: true, result });
    } catch (error) {
        parentPort.postMessage({ success: false, error: error.message });
    }
})();

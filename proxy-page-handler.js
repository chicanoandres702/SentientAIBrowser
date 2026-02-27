// Feature: System Utilities | Trace: proxy-routes-browser.js
const { getBrowser } = require('./proxy-config');
const { BLOCKED_EXTENSIONS } = require('./proxy-asset');

const activePages = new Map();

/**
 * Why: Blocks non-essential resources like images, fonts, and stylesheets from being
 * downloaded by the headless browser. This dramatically improves page load speed
 * and reduces memory/CPU usage.
 */
async function setupRequestBlocking(page) {
  await page.route('**/*', (route) => {
    const url = route.request().url();
    const isBlocked = BLOCKED_EXTENSIONS.some(ext => url.endsWith(ext));
    if (isBlocked) {
      route.abort();
    } else {
      route.continue();
    }
  });
}

async function getPersistentPage(targetUrl, tabId) {
  const browser = await getBrowser();
  let page = activePages.get(tabId);
  if (!page) {
    page = await browser.newPage();
    await setupRequestBlocking(page);
    activePages.set(tabId, page);
  }
  const currentUrl = page.url();
  if (currentUrl === 'about:blank' || (!currentUrl.includes(targetUrl) && !targetUrl.includes(currentUrl))) {
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  }
  return page;
}

async function closePage(tabId) { if (activePages.has(tabId)) { await activePages.get(tabId).close(); activePages.delete(tabId); } }

module.exports = { getPersistentPage, closePage, activePages };
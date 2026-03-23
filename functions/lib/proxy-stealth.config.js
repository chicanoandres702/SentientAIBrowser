"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.is2FAPage = exports.TFA_URL_PATTERNS = exports.STEALTH_INIT_SCRIPT = exports.STEALTH_UA = exports.BLOCKED_EXTENSIONS = void 0;
exports.setupRequestBlocking = setupRequestBlocking;
const proxy_nav_controller_1 = require("./proxy-nav-controller");
// Why: block heavy binary resources that waste bandwidth and slow down Playwright.
// Images/fonts/media are irrelevant for the LLM's ARIA snapshot + screenshot flow.
exports.BLOCKED_EXTENSIONS = [
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico',
    '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.webm',
];
// Why: stealth headers — make Playwright look like a real Chrome user.
// Without these, Google/Cloudflare instantly detect navigator.webdriver and show CAPTCHAs.
exports.STEALTH_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
exports.STEALTH_INIT_SCRIPT = `
  Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
  Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
  Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
  Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
  Object.defineProperty(navigator, 'plugins', { get: () => {
    const mkPlugin = (name, desc, filename) => { const p = Object.create(Plugin.prototype); Object.assign(p, { name, description: desc, filename }); return p; };
    return [mkPlugin('PDF Viewer','Portable Document Format','internal-pdf-viewer'), mkPlugin('Chrome PDF Viewer','Portable Document Format','mhjfbmdgcfjbbpaeojofohoefgiehjai'), mkPlugin('Chromium PDF Viewer','Portable Document Format','internal-pdf-viewer')];
  }});
  window.chrome = { runtime: {}, loadTimes: () => ({}), csi: () => ({}), app: { isInstalled: false, InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' }, RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' } } };
  if (window.navigator.permissions) {
    const origQuery = window.navigator.permissions.query.bind(window.navigator.permissions);
    window.navigator.permissions.query = (params) =>
      params.name === 'notifications'
        ? Promise.resolve({ state: 'default', onchange: null })
        : origQuery(params);
  }
  if (!navigator.connection) {
    Object.defineProperty(navigator, 'connection', { get: () => ({ rtt: 50, downlink: 10, effectiveType: '4g', saveData: false }) });
  }
`;
exports.TFA_URL_PATTERNS = [
    '/mfa', '/2fa', '/two-factor', '/otp', '/verify',
    '/challenge', '/checkpoint', 'totp', 'step-up',
    '/signin/v2/challenge', 'accounts.google.com/signin',
    'login.microsoftonline.com', 'appleid.apple.com',
];
const is2FAPage = (url) => {
    const lower = url.toLowerCase();
    return (0, proxy_nav_controller_1.isAuthWallUrl)(url) || exports.TFA_URL_PATTERNS.some(p => lower.includes(p));
};
exports.is2FAPage = is2FAPage;
async function setupRequestBlocking(page) {
    await page.route('**/*', (route) => {
        const url = route.request().url();
        if (exports.BLOCKED_EXTENSIONS.some(ext => url.endsWith(ext)))
            route.abort();
        else
            route.continue();
    });
}
//# sourceMappingURL=proxy-stealth.config.js.map
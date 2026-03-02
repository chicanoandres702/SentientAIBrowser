// Feature: Stealth Config | Trace: README.md
import { Page } from 'playwright';
import { isAuthWallUrl } from './proxy-nav-controller';

// Why: block heavy binary resources that waste bandwidth and slow down Playwright.
// Images/fonts/media are irrelevant for the LLM's ARIA snapshot + screenshot flow.
export const BLOCKED_EXTENSIONS = [
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico',
    '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.webm',
];

// Why: stealth headers — make Playwright look like a real Chrome user.
// Without these, Google/Cloudflare instantly detect navigator.webdriver and show CAPTCHAs.
export const STEALTH_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

export const STEALTH_INIT_SCRIPT = `
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

export const TFA_URL_PATTERNS = [
    '/mfa', '/2fa', '/two-factor', '/otp', '/verify',
    '/challenge', '/checkpoint', 'totp', 'step-up',
    '/signin/v2/challenge', 'accounts.google.com/signin',
    'login.microsoftonline.com', 'appleid.apple.com',
];

export const is2FAPage = (url: string): boolean => {
    const lower = url.toLowerCase();
    return isAuthWallUrl(url) || TFA_URL_PATTERNS.some(p => lower.includes(p));
};

export async function setupRequestBlocking(page: Page): Promise<void> {
    await page.route('**/*', (route) => {
        const url = route.request().url();
        if (BLOCKED_EXTENSIONS.some(ext => url.endsWith(ext))) route.abort();
        else route.continue();
    });
}

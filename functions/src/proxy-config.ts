// Feature: System Utilities | Trace: README.md
import { chromium, Browser } from 'playwright';
import { db, auth } from './auth/firebase-config';

export { db, auth };

// Cloud Run injects PORT env var. Fallback to 3000 for local dev.
export const PORT = parseInt(process.env.PORT || '3000', 10);

let browserInstance: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',      // use /tmp instead of /dev/shm (small in containers)
        '--disable-gpu',
        '--single-process',              // reduce memory footprint
        '--no-zygote',                   // required with --single-process in containers
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--mute-audio',
      ]
    });
    console.log('[Proxy] Browser launched successfully');
  }
  return browserInstance;
}

export function stripSecurityHeaders(res: any) {
  res.removeHeader('X-Frame-Options');
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('Content-Security-Policy-Report-Only');
  res.removeHeader('X-Content-Type-Options');
}

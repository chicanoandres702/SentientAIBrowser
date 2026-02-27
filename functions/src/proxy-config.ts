// Feature: System Utilities | Trace: README.md
import { chromium, Browser } from 'playwright';
import { db, auth } from './auth/firebase-config';

export { db, auth };

// Why: In the Local-First Hybrid model, the browser proxy runs on localhost:3000.
export const PORT = 3000;

let browserInstance: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browserInstance) {
    browserInstance = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }
  return browserInstance;
}

export function stripSecurityHeaders(res: any) {
  res.removeHeader('X-Frame-Options');
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('Content-Security-Policy-Report-Only');
  res.removeHeader('X-Content-Type-Options');
}

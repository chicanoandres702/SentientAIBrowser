// Feature: Playwright User Data Mount | Trace: shared/playwrightUserData.service.ts
import { chromium, BrowserContext } from 'playwright';

export async function launchWithUserData(userDataDir: string): Promise<BrowserContext> {
  // Launch persistent context with user data directory
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false, // Set to true for headless mode
    // You can add more options here
  });
  return context;
}

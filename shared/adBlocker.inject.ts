// Feature: Ad Blocker Injection | Trace: shared/adBlocker.inject.ts
import { Page } from 'playwright';
import fs from 'fs';

export async function injectAdBlocker(page: Page) {
  const script = fs.readFileSync(require.resolve('./adBlocker.dom.js'), 'utf8');
  await page.addInitScript({ content: script });
}

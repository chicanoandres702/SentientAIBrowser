// Feature: Workflow Integration | Trace: src/features/workflow/workflow.integration.ts
import { chromium } from 'playwright';
import { injectAdBlocker } from '../../../shared/adBlocker.inject';
import { ScreenshotStreamService } from '../../../shared/screenshotStream.service';

async function runWorkflow() {
  // Launch browser and create page
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Inject ad blocker
  await injectAdBlocker(page);

  // Connect screenshot stream to WebSocket server
  const screenshotStream = new ScreenshotStreamService('ws://localhost:8080');
  await screenshotStream.streamScreenshot(page, 2000); // every 2 seconds

  // Navigate to a test page
  await page.goto('https://example.com');

  // ...add workflow logic here...

  // Close after some time for demo
  setTimeout(async () => {
    await browser.close();
  }, 10000);
}

runWorkflow();

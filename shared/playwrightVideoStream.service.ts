// Feature: Playwright Video Stream | Trace: shared/playwrightVideoStream.service.ts
import { BrowserContext, Page } from 'playwright';
import WebSocket from 'ws';
import fs from 'fs';

export async function recordAndStreamVideo(context: BrowserContext, wsUrl: string) {
  // Enable video recording for context
  const videoDir = './videos';
  const page = await context.newPage();
  await page.goto('https://example.com');
  // Playwright records video automatically if context is configured
  // After test, get video path
  const videoPath = await page.video().path();
  await page.close();

  // Stream video file over WebSocket
  const ws = new WebSocket(wsUrl);
  ws.on('open', () => {
    const stream = fs.createReadStream(videoPath);
    stream.on('data', chunk => ws.send(chunk));
    stream.on('end', () => ws.close());
  });
}

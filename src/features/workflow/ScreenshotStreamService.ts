// Feature: Screenshot Stream Service | Trace: src/features/workflow/ScreenshotStreamService.ts
/*
AIDDE TRACE HEADER
File: ScreenshotStreamService.ts
Feature: Live screenshot streaming for workflow/tab sessions
Why: Visual feedback, debugging, and audit
*/

export class ScreenshotStreamService {
  private listeners: ((img: string) => void)[] = [];

  startStream(tabId: string) {
    // Simulate screenshot stream (replace with real WebSocket/FFmpeg logic)
    setInterval(() => {
      const img = `data:image/png;base64,${btoa(tabId + Date.now())}`;
      this.listeners.forEach(fn => fn(img));
    }, 2000);
  }

  onScreenshot(fn: (img: string) => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }
}

export const screenshotStreamService = new ScreenshotStreamService();

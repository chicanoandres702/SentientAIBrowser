// Feature: Screenshot/Video Stream | Trace: shared/screenshotStream.service.ts
import { Page } from 'playwright';
import WebSocket from 'ws';

export class ScreenshotStreamService {
  private ws: WebSocket;
  // No interval: frames are sent only when received from WebSocket origin
  constructor(wsUrl: string) {
    this.ws = new WebSocket(wsUrl);
    this.ws.on('error', err => {
      console.error('WebSocket error:', err);
    });
    this.ws.on('close', () => {
      this.clearInterval();
    });
  }
  // No interval logic needed
  /**
   * Instead of repeatedly calling page.screenshot, this method listens for frames from the origin WebSocket
   * and forwards them to the client WebSocket.
   * @param originWs WebSocket connection from the browser/page origin
   */
  streamFromOrigin(originWs: WebSocket) {
    originWs.on('message', (frame: Buffer) => {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(frame);
      }
    });
    originWs.on('error', err => {
      console.error('Origin WebSocket error:', err);
    });
    originWs.on('close', () => {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ status: 'origin stream closed' }));
      }
    });
  }
  /**
   * Streams video from Playwright using ffmpeg and WebSocket.
   * @param page Playwright Page
   * @param durationMs Duration to record (ms)
   */
  async streamVideo(page: Page, durationMs = 10000) {
    const { spawn } = require('child_process');
    try {
      // Start Playwright video recording
      // Chromium only: must launch context with recordVideo option
      const context = page.context();
      // Playwright video recording: context must be created with recordVideo option
      // After page.close(), video will be available via page.video().path()
      setTimeout(async () => {
        try {
          await page.close();
        } catch (err) {
          // ignore
        }
      }, durationMs);
      let videoPath: string = '';
      if (page.video) {
        const video = page.video();
        if (video && typeof video.path === 'function') {
          videoPath = await video.path();
        }
      }
      if (!videoPath) {
        throw new Error('Video path not available. Ensure context is created with recordVideo option.');
      }

      // Use ffmpeg to stream video file via WebSocket
      // ffmpeg -re -i <videoPath> -f mpegts -codec:v mpeg1video -b:v 800k -r 30 -
      const ffmpeg = spawn('ffmpeg', [
        '-re',
        '-i', videoPath,
        '-f', 'mpegts',
        '-codec:v', 'mpeg1video',
        '-b:v', '800k',
        '-r', '30',
        '-'],
        { stdio: ['ignore', 'pipe', 'ignore'] }
      );

      ffmpeg.stdout.on('data', (chunk: Buffer) => {
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(chunk);
        }
      });

      ffmpeg.on('error', (err: unknown) => {
        console.error('ffmpeg error:', err);
        if (this.ws.readyState === WebSocket.OPEN) {
          const details = typeof err === 'object' && err !== null && 'message' in err ? (err as any).message : String(err);
          this.ws.send(JSON.stringify({ error: 'ffmpeg error', details }));
        }
      });

      ffmpeg.on('close', (code: number) => {
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ status: 'video stream ended', code }));
        }
      });
    } catch (err) {
      console.error('Video stream error:', err);
      if (this.ws.readyState === WebSocket.OPEN) {
        const details = typeof err === 'object' && err !== null && 'message' in err ? (err as any).message : String(err);
        this.ws.send(JSON.stringify({ error: 'Video stream error', details }));
      }
    }
  }
}

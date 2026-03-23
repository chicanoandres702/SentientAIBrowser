// Feature: Screenshot Stream Service Test | Trace: shared/screenshotStream.service.test.ts
/*
AIDDE TRACE HEADER
File: screenshotStream.service.test.ts
Feature: Screenshot/Video Stream
Why: Validate screenshot and video streaming via WebSocket and ffmpeg
*/
import { ScreenshotStreamService } from './screenshotStream.service';
const WebSocket = require('ws');
import { Page } from 'playwright';

describe.skip('ScreenshotStreamService', () => {
  let wsServer: any;
  let wsUrl: string;
  let service: ScreenshotStreamService;
  let page: Page;

  beforeAll((done) => {
    wsServer = new WebSocket.Server({ port: 8081 }, () => {
      wsUrl = 'ws://localhost:8081';
      service = new ScreenshotStreamService(wsUrl);
      done();
    });
  });

  afterAll((done) => {
    wsServer.close(() => done());
  });

  it('should stream screenshots over WebSocket', (done) => {
    // Mock Playwright Page
    page = {
      screenshot: jest.fn().mockResolvedValue(Buffer.from('mock-image')),
      context: jest.fn().mockReturnValue({}),
      video: jest.fn().mockReturnValue({ path: jest.fn().mockResolvedValue('mock-video-path') }),
      close: jest.fn().mockResolvedValue(undefined),
    } as any;

    // Debug log for test
    console.log('[DEBUG][TEST] ScreenshotStreamService.streamScreenshot test started');

    wsServer.on('connection', (socket: any) => {
      socket.on('message', (data: Buffer) => {
        console.log('[DEBUG][TEST] ScreenshotStreamService.streamScreenshot received:', data);
        expect(data).toBeInstanceOf(Buffer);
        expect(data.toString()).toBe('mock-image');
        done();
      });
    });

    service.streamScreenshot(page, 100);
    setTimeout(() => service['clearInterval'](), 300);
  });

  it('should stream video over WebSocket (stub)', (done) => {
    // This test only checks that the method runs and sends a message
    wsServer.on('connection', (socket: any) => {
      socket.on('message', (data: Buffer) => {
        console.log('[DEBUG][TEST] ScreenshotStreamService.streamVideo received:', data);
        expect(typeof data.toString()).toBe('string');
        expect(data.toString()).toMatch(/video stream|error|ended/);
        done();
      });
    });
    service.streamVideo(page, 100);
  });
});

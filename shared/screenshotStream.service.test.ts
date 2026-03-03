/*
AIDDE TRACE HEADER
File: screenshotStream.service.test.ts
Feature: Screenshot/Video Stream
Why: Validate screenshot and video streaming via WebSocket and ffmpeg
*/
import { ScreenshotStreamService } from './screenshotStream.service';
const WebSocket = require('ws');
import { Page } from 'playwright';

describe('ScreenshotStreamService', () => {
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
    } as any;

    wsServer.on('connection', (socket: any) => {
      socket.on('message', (data: Buffer) => {
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
        expect(data.toString()).toMatch(/video stream|error|ended/);
        done();
      });
    });
    service.streamVideo(page, 100);
  });
});

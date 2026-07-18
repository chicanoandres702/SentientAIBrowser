// kilo/core/kilo-browser-video.js
// Feature: Kilo Live Browser Video | Trace: kilo/core/kilo-browser-video.js
// Why: The user wants to SEE the browser while kilo works. We use Playwright's
// NATIVE video recording (context option recordVideo) — no ffmpeg required.
// A long-lived page is opened and kept in sync with kilo's browsing by exposing
// goto()/act() helpers. Frames are served as MJPEG over a tiny HTTP server so
// any browser can watch at http://localhost:<port>/stream.mjpg.
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const VIDEO_DIR = process.env.KILO_VIDEO_DIR || path.join(process.cwd(), "kilo-videos");

class KiloBrowserVideo {
  constructor(opts = {}) {
    this.videoDir = opts.videoDir || VIDEO_DIR;
    this.port = opts.port || parseInt(process.env.KILO_VIDEO_PORT || "8088", 10);
    this.browser = null;
    this.context = null;
    this.page = null;
    this.server = null;
    this.clients = new Set();
    this.lastFrame = null;
    this.frameTimer = null;
    this.fps = opts.fps || 8;
  }

  async start() {
    fs.mkdirSync(this.videoDir, { recursive: true });
    this.browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
    this.context = await this.browser.newContext({
      recordVideo: { dir: this.videoDir, size: { width: 1280, height: 720 } },
      // The viewer is local automation; ignore TLS errors from intercepting
      // proxies so kilo can browse any host.
      ignoreHTTPSErrors: true,
    });
    this.page = await this.context.newPage();
    await this.page.goto("about:blank");
    this._startFrameLoop();
    this._startServer();
    return this;
  }

  // Keep kilo's visible page in sync with the recording page.
  async navigate(url) {
    if (!this.page) return;
    await this.page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  }

  async act(fn) {
    if (!this.page) return;
    await fn(this.page);
  }

  getPage() {
    return this.page;
  }

  currentVideoPath() {
    if (!this.page || !this.page.video) return null;
    const v = this.page.video();
    if (!v || typeof v.path !== "function") return null;
    try {
      return v.path();
    } catch {
      return null;
    }
  }

  _startFrameLoop() {
    // Capture frames at the chosen FPS. We screenshot the live page (Playwright
    // native) rather than decoding the video file — simplest, dependency-free.
    this.frameTimer = setInterval(async () => {
      if (!this.page) return;
      try {
        const buf = await this.page.screenshot({ type: "jpeg", quality: 60 });
        this.lastFrame = buf;
        for (const res of this.clients) {
          try {
            res.write(`--kilo-frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${buf.length}\r\n\r\n`);
            res.write(buf);
            res.write("\r\n");
          } catch {
            /* drop dead client */
          }
        }
      } catch {
        /* page may be navigating */
      }
    }, Math.max(100, Math.round(1000 / this.fps)));
  }

  _startServer() {
    this.server = http.createServer((req, res) => {
      if (req.url === "/stream.mjpg") {
        res.writeHead(200, {
          "Content-Type": "multipart/x-mixed-replace; boundary=kilo-frame",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        });
        this.clients.add(res);
        res.on("close", () => this.clients.delete(res));
        return;
      }
      if (req.url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, clients: this.clients.size, video: this.currentVideoPath() }));
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(
        `<!doctype html><html><head><title>Kilo Live Browser</title></head><body style="margin:0;background:#000">` +
          `<img src="/stream.mjpg" style="width:100%;height:100vh;object-fit:contain" />` +
          `</body></html>`
      );
    });
    this.server.listen(this.port);
  }

  url() {
    return `http://localhost:${this.port}/`;
  }

  async stop() {
    if (this.frameTimer) clearInterval(this.frameTimer);
    for (const c of this.clients) {
      try {
        c.end();
      } catch {
        /* ignore */
      }
    }
    this.clients.clear();
    if (this.server) await new Promise((r) => this.server.close(r));
    if (this.context) await this.context.close().catch(() => {});
    if (this.browser) await this.browser.close().catch(() => {});
  }
}

module.exports = { KiloBrowserVideo, VIDEO_DIR };

// kilo/__tests__/kilo-browser-video.test.js
// Integration test for live video: launches chromium, serves MJPEG, a client
// can connect and receive at least one frame. Uses Playwright native recording.
const { KiloBrowserVideo } = require("../core/kilo-browser-video");
const http = require("http");

function get(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let chunks = 0;
        res.on("data", () => chunks++);
        res.on("end", () => resolve({ status: res.statusCode, chunks }));
      })
      .on("error", reject);
  });
}

describe("KiloBrowserVideo (live browser)", () => {
  let video;
  jest.setTimeout(60000);

  afterEach(async () => {
    if (video) await video.stop();
    video = null;
  });

  test("starts, navigates, and serves a live MJPEG frame", async () => {
    video = new KiloBrowserVideo({ port: 8099, fps: 10 });
    await video.start();
    // Render local content (no external network dependency in the sandbox).
    await video.act(async (page) => {
      await page.setContent("<h1>Kilo Live Browser</h1><p>streaming frames...</p>");
    });

    // Health endpoint reports the server is up.
    const health = await get("http://localhost:8099/health");
    expect(health.status).toBe(200);

    // Open the MJPEG stream and confirm at least one JPEG frame arrives.
    const frame = await new Promise((resolve, reject) => {
      const req = http.get("http://localhost:8099/stream.mjpg", (res) => {
        let buf = Buffer.alloc(0);
        const onData = (c) => {
          buf = Buffer.concat([buf, c]);
          // A JPEG frame begins with ffd8 and ends with ffd9.
          if (buf.includes(Buffer.from([0xff, 0xd8])) && buf.includes(Buffer.from([0xff, 0xd9]))) {
            res.destroy();
            resolve(true);
          }
        };
        res.on("data", onData);
        res.on("error", reject);
      });
      req.on("error", reject);
      setTimeout(() => resolve(false), 8000);
    });

    expect(frame).toBe(true);
    expect(video.currentVideoPath()).toBeTruthy();
  });
});

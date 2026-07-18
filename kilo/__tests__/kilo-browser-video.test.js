// kilo/__tests__/kilo-browser-video.test.js
// Unit/integration test for the lightweight live viewer: it serves an HTML
// page, a JSON state endpoint, and an SSE stream of live updates. No Playwright
// or ffmpeg required.
const { KiloBrowserVideo } = require("../core/kilo-browser-video");
const http = require("http");

function get(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve({ status: res.statusCode, body }));
      })
      .on("error", reject);
  });
}

describe("KiloBrowserVideo (live viewer)", () => {
  let video;
  jest.setTimeout(20000);

  afterEach(async () => {
    if (video) await video.stop();
    video = null;
  });

  test("serves HTML and reflects live state over SSE", async () => {
    video = new KiloBrowserVideo({ port: 8099 });
    await video.start();

    const html = await get("http://localhost:8099/");
    expect(html.status).toBe(200);
    expect(html.body).toContain("Kilo");

    const health = await get("http://localhost:8099/health");
    expect(health.status).toBe(200);

    video.setTask("demo task");
    video.setPlan([{ content: "step a", status: "pending" }]);
    video.setStep(0, { content: "step a", status: "in_progress" });
    video.appendOutput("first line");

    const state = await get("http://localhost:8099/state");
    expect(state.status).toBe(200);
    const parsed = JSON.parse(state.body);
    expect(parsed.task).toBe("demo task");
    expect(parsed.plan).toHaveLength(1);
    expect(parsed.log).toContain("first line");

    // SSE endpoint streams the current state on connect.
    const sse = await new Promise((resolve, reject) => {
      const req = http.get("http://localhost:8099/stream", (res) => {
        let buf = "";
        res.on("data", (c) => {
          buf += c;
          if (buf.includes("data:")) {
            res.destroy();
            resolve(buf);
          }
        });
        res.on("error", reject);
      });
      req.on("error", reject);
      setTimeout(() => resolve(buf), 4000);
    });
    expect(sse).toContain("demo task");
  });

  test("auto-increments the port when busy", async () => {
    const first = new KiloBrowserVideo({ port: 8101 });
    await first.start();
    const second = new KiloBrowserVideo({ port: 8101 });
    await second.start();
    expect(second.port).toBeGreaterThan(8101);
    await first.stop();
    await second.stop();
  });
});

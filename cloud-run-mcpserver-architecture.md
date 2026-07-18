# Kilo — Architecture (replaces the old Cloud Run sentient-proxy)

> The old `sentient-proxy` (CDP tunnel + ffmpeg WebSocket video) has been
> replaced by **Kilo**. See `cloud-run-playwright-proxy.md` for the user-facing
> guide. This file records the architectural shift.

---

## What changed

- **No more proxy server.** There is no `proxy-server.js` to run. `start-proxy.sh`
  and `run-proxy.ps1` were removed.
- **Kilo drives the Kilo/OpenCode HTTP server directly** (`POST /session`,
  `POST /session/:id/message`, `GET /event` SSE, `POST /mcp`).
- **Inner Playwright MCP** is registered with the server via `POST /mcp`
  (`@playwright/mcp`), so the model auto-browses with `mcp__playwright__*` tools.
- **Live video** uses Playwright **native** `recordVideo` + an MJPEG HTTP server
  (no ffmpeg). Watch at `http://localhost:8088/`.
- **Planner** runs first (server `plan` agent, with a local single-step
  fallback) so Kilo always makes a plan before browsing.

## Server endpoints Kilo uses

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/global/health` | health/version |
| GET | `/config/providers` | provider + model IDs |
| GET | `/agent` | list agents (incl. `plan`, `kilo`) |
| POST | `/session` | create a planning/browsing session |
| POST | `/session/:id/message` | send a prompt, wait for response |
| GET | `/session/:id/todo` | read the plan/todo list |
| POST | `/mcp` | register the inner Playwright MCP |
| GET | `/mcp` | MCP connection status |
| GET | `/event` | SSE stream of progress |

## Implementation

```
kilo/core/kilo.js            -> orchestrator
kilo/core/kilo-client.js     -> HTTP + SSE client
kilo/core/kilo-planner.js    -> planner (server `plan` agent + fallback)
kilo/core/kilo-browser-mcp.js-> inner Playwright MCP registration
kilo/core/kilo-browser-video.js-> Playwright-native video + MJPEG server
```

- **Purpose:** Real-time browser automation, tab sync, workflow control.
- **Protocol:** WebSocket (JSON messages)
- **Sample Message:**
  ```json
  {
    "action": "runWorkflow",
    "workflowId": "123",
    "params": { "url": "https://example.com" }
  }
  ```
- **Response:**
  ```json
  {
    "workflowId": "123",
    "status": "completed",
    "result": "Success!"
  }
  ```

### 2. CDP Proxy: `/cdp-proxy/<path>`
- **Purpose:** Chrome DevTools Protocol tunneling for remote browser inspection.
- **Protocol:** WebSocket (raw frames)
- **Usage:**
  - Desktop: `chrome://inspect` → add `<cloudrun-host>:443`
  - Mobile: Open the DevTools URL returned by `GET /cdp/info`

### 3. REST API: `/`
- **Purpose:** Exposes Express routes for browser control, workflow management, and health checks.
- **Protocol:** HTTP (JSON)
- **Sample Endpoints:**
  - `GET /health` → `{ status: "ok" }`
  - `POST /workflow/run` → `{ workflowId, params }`
  - `GET /cdp/info` → `{ devtoolsUrl }`

- **Current:** `--allow-unauthenticated` (public access)
- **Options:**

---


## FFmpeg Video Streaming (Comprehensive)
MCPServer enables real-time video streaming of browser sessions using Playwright and FFmpeg. This feature supports live preview, recording, and remote monitoring for automation workflows.

### How It Works
- **Playwright** launches a browser session with video recording enabled.
- **FFmpeg** processes the recorded video file and streams it as MPEG-TS over WebSocket.
- **WebSocket endpoint** (`/proxy/ws/<tabId>`) delivers binary video frames to the client.
- **REST API** can be used to initiate, control, or stop the stream.

### Server-Side Implementation (TypeScript)
Key logic from `shared/screenshotStream.service.ts`:
```typescript
import { Page } from 'playwright';
import WebSocket from 'ws';

export class ScreenshotStreamService {
  private ws: WebSocket;
  constructor(wsUrl: string) {
    this.ws = new WebSocket(wsUrl);
  }
  async streamVideo(page: Page, durationMs = 10000) {
    const { spawn } = require('child_process');
    let videoPath = '';
    if (page.video) {
      const video = page.video();
      if (video && typeof video.path === 'function') {
        videoPath = await video.path();
      }
    }
    if (!videoPath) throw new Error('Video path not available.');
    const ffmpeg = spawn('ffmpeg', [
      '-re', '-i', videoPath,
      '-f', 'mpegts', '-codec:v', 'mpeg1video', '-b:v', '800k', '-r', '30', '-'
    ], { stdio: ['ignore', 'pipe', 'ignore'] });
    ffmpeg.stdout.on('data', (chunk: Buffer) => {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(chunk);
      }
    });
  }
}
```

### Client-Side Example (Node.js)
Connect and receive video frames:
```js
const WebSocket = require('ws');
const ws = new WebSocket('wss://sentient-proxy-184717935920.us-central1.run.app/proxy/ws/myTabId');
ws.on('open', () => {
  ws.send(JSON.stringify({
    action: 'startVideoStream',
    tabId: 'myTabId',
    options: { format: 'mpegts', resolution: '1280x720' }
  }));
});
ws.on('message', (data) => {
  if (Buffer.isBuffer(data)) {
    // Save, decode, or forward MPEG-TS video frames
  } else {
    // Handle JSON status messages
    console.log('Status:', data.toString());
  }
});
```

### WebSocket Message Format
- **Start streaming:**
  ```json
  {
    "action": "startVideoStream",
    "tabId": "myTabId",
    "options": {
      "format": "mpegts",
      "resolution": "1280x720"
    }
  }
  ```
- **Status/Errors:**
  ```json
  { "status": "starting video stream", "info": "Preparing video recording..." }
  { "status": "ffmpeg started", "info": "Streaming video..." }
  { "status": "video stream ended", "code": 0 }
  { "status": "error", "info": "Video path not available." }
  ```

### Integration Steps
1. Launch Playwright browser with video recording enabled (`recordVideo` context option).
2. Connect to the WebSocket endpoint with your tab/session ID.
3. Send a `startVideoStream` action message.
4. Receive binary MPEG-TS frames and process them (save, decode, or forward to a player).
5. Monitor status/error messages for stream lifecycle events.
6. Optionally, use REST API to stop or manage the stream.

### Advanced Usage
- For browser playback, use a `<video>` element with a MediaSource extension or a player supporting MPEG-TS.
- For saving, write binary frames to a `.ts` file and play with VLC or ffplay.
- For custom workflows, see `shared/screenshotStream.service.ts` for more streaming options.

### Notes
- FFmpeg must be installed and available in the container (see Dockerfile).
- Video streaming requires sufficient bandwidth and client-side decoding.
- Error/status messages are sent as JSON; video frames as binary.

- Use the WebSocket endpoint for real-time automation and tab sync.
- Use REST endpoints for workflow management and health checks.
- Use CDP proxy for remote browser inspection and debugging.

---

For further details, see the Dockerfile, `proxy-server.js`, and your Cloud Run dashboard.

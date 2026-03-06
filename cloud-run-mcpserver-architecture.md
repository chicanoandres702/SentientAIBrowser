# Cloud Run MCPServer Architectural Rundown

---

## Service URLs
- **Service Name:** `sentient-proxy`
- **Region:** `us-central1`
- **Base URL:** `https://sentient-proxy-184717935920.us-central1.run.app`
- **WebSocket Endpoint:** `wss://sentient-proxy-184717935920.us-central1.run.app/proxy/ws/<tabId>`
---

### 1. WebSocket: `/proxy/ws/<tabId>`
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

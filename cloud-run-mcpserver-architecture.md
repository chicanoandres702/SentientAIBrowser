# Cloud Run MCPServer Architectural Rundown

## Overview
MCPServer is a Node.js-based Playwright proxy deployed on Google Cloud Run. It exposes WebSocket and HTTP endpoints for browser automation, workflow orchestration, and Chrome DevTools Protocol (CDP) tunneling.

---

## Service URLs
- **Base URL:** `https://mcpserver-184717935920.us-central1.run.app`
- **WebSocket Endpoint:** `wss://mcpserver-184717935920.us-central1.run.app/proxy/ws/<tabId>`
- **CDP Proxy Endpoint:** `wss://mcpserver-184717935920.us-central1.run.app/cdp-proxy/<path>`
- **REST API Endpoint:** `https://mcpserver-184717935920.us-central1.run.app/`

---

## API Endpoints

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

---

## Authentication
- **Current:** `--allow-unauthenticated` (public access)
- **Options:**
  - Google IAM
  - API keys
  - OAuth2 tokens

---

## Deployment & Scaling
- **Platform:** Google Cloud Run (managed)
- **Region:** `us-central1`
- **Container Image:** `gcr.io/sentient-ai-browser/mcpserver`
- **Dockerfile:** Located in `functions/Dockerfile`
- **Entrypoint:** `node lib/proxy-server.js`
- **Auto-scaling:** Cloud Run scales instances based on traffic.

---

## Internal Architecture
- **Express.js**: Handles HTTP routes and middleware (CORS, JSON parsing).
- **WebSocket Server**: Handles `/proxy/ws/<tabId>` for tab sync and workflow control.
- **CDP Proxy**: Tunnels WebSocket frames to Chrome DevTools running inside the container.
- **Playwright**: Automates browser sessions, runs workflows, streams results.
- **Orchestrator**: Manages workflow execution, status, and result reporting.
- **Tab Sync Broker**: Pushes browser state (screenshots, URL, title) to clients.
- **Notification Service**: Sends workflow status and AI decisions to UI clients.

---

## Example Node.js Client
```js
const WebSocket = require('ws');
const wsUrl = 'wss://mcpserver-184717935920.us-central1.run.app/proxy/ws/myTabId';
const ws = new WebSocket(wsUrl);
ws.on('open', () => {
  ws.send(JSON.stringify({
    action: 'runWorkflow',
    workflowId: '123',
    params: { url: 'https://example.com' }
  }));
});
ws.on('message', (data) => {
  const msg = JSON.parse(data);
  console.log('Received:', msg);
});
```

---

## Security & Monitoring
- **IAM & API keys**: Recommended for production.
- **Logs & Metrics**: Available in Google Cloud Console.
- **Health Checks**: Use `/health` endpoint for status.

---

## Integration Notes
- Use the WebSocket endpoint for real-time automation and tab sync.
- Use REST endpoints for workflow management and health checks.
- Use CDP proxy for remote browser inspection and debugging.

---

For further details, see the Dockerfile, `proxy-server.js`, and your Cloud Run dashboard.

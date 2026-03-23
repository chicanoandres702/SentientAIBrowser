# Cloud Run Playwright Proxy Connection Details

## Service URLs

- **mcpserver:**
  - URL: `https://mcpserver-184717935920.us-central1.run.app`
- **sentient-proxy:**
  - URL: `https://sentient-proxy-184717935920.us-central1.run.app`

## WebSocket Endpoint Example

```
wss://mcpserver-184717935920.us-central1.run.app/proxy/ws/<tabId>
```
Replace `<tabId>` with your session or tab identifier.

## REST API Endpoint Example

```
https://mcpserver-184717935920.us-central1.run.app/
```

## Example Node.js Client Code

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

ws.on('error', (err) => {
  console.error('WebSocket error:', err);
});

ws.on('close', () => {
  console.log('WebSocket connection closed');
});
```

## Authentication
- Both services are currently set to `--allow-unauthenticated` (public access).
- For private endpoints, use Google IAM, API keys, or OAuth2 tokens.

## Deployment Info
- Region: `us-central1`
- Project: `sentient-ai-browser`
- Last deployed by: `andrew.moreno.5691@gmail.com`
- Last deployed at: `2026-03-05T01:50:07.526012Z`

---
For further integration, use the above URLs and code samples to connect any interface to your Playwright proxy on Cloud Run.

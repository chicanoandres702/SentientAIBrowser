# Sentient AI Browser — Proxy Container Architecture

A complete reference for reusing this proxy in another project.  
The proxy is a standalone **Express + Playwright** Node.js service that runs in a Docker container on Google Cloud Run. It controls a headless Chromium browser, exposes the browser state via REST/SSE, and optionally connects to Firebase/Firestore to sync state with a frontend.

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Docker Container](#2-docker-container)
3. [Entry Point — proxy-server.ts](#3-entry-point--proxy-serverts)
4. [Browser Management — proxy-config.ts](#4-browser-management--proxy-configts)
5. [Page Lifecycle — proxy-page-handler.ts](#5-page-lifecycle--proxy-page-handlerts)
6. [Navigation Guard — proxy-nav-controller.ts](#6-navigation-guard--proxy-nav-controllerts)
7. [Route Map (Full API Reference)](#7-route-map-full-api-reference)
8. [Screenshot Streaming](#8-screenshot-streaming)
9. [Direct Input Control (Remote Mode)](#9-direct-input-control-remote-mode)
10. [CDP Bridge — Chrome DevTools Protocol](#10-cdp-bridge--chrome-devtools-protocol)
11. [LLM Agent Routes](#11-llm-agent-routes)
12. [HTML Rewriting & Scanning](#12-html-rewriting--scanning)
13. [Firestore Sync (optional)](#13-firestore-sync-optional)
14. [AI Mission Executor](#14-ai-mission-executor)
15. [Environment Variables](#15-environment-variables)
16. [Deployment](#16-deployment)
17. [Adapting for a New Project](#17-adapting-for-a-new-project)

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Cloud Run Container               │
│                                                     │
│   ┌──────────────┐       ┌─────────────────────┐   │
│   │ Express App  │ ←──── │  proxy-server.ts    │   │
│   │ (port 8080)  │       │  http.createServer  │   │
│   └──────┬───────┘       └─────────────────────┘   │
│          │                                          │
│   ┌──────▼────────────────────────────────────┐    │
│   │           Route Modules                   │    │
│   │  browser · nav · action · mouse · type   │    │
│   │  agent · cdp · screenshot · dom-map       │    │
│   └──────┬────────────────────────────────────┘    │
│          │                                          │
│   ┌──────▼───────┐       ┌──────────────────────┐  │
│   │  Playwright  │ ─────►│  Chromium (headless) │  │
│   │  Page Pool   │       │  port 9222 (CDP)     │  │
│   └──────────────┘       └──────────────────────┘  │
│                                                     │
│   ┌──────────────────────────────────────────────┐ │
│   │  WS Upgrade Tunnel  /cdp-proxy/*  → :9222   │ │
│   └──────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
         │                        │
  HTTPS REST / SSE          WSS /cdp-proxy
         │                        │
  React Native / Web        chrome://inspect
  Frontend (Firebase)       or DevTools Frontend
```

---

## 2. Docker Container

**File:** `functions/Dockerfile`

Two-stage build:
1. **Stage 1 (`node:20-slim`)** — `npm ci` + `tsc` compile → outputs to `/app/lib/`
2. **Stage 2 (`mcr.microsoft.com/playwright:v1.58.2-noble`)** — copies compiled JS, runs `npx playwright install chromium`, exposes port 8080.

The Playwright base image bundles all Chromium system dependencies so you don't need to apt-install anything yourself.

```dockerfile
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

FROM mcr.microsoft.com/playwright:v1.58.2-noble
WORKDIR /app
COPY --from=build /app/lib ./lib
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
RUN npx playwright install chromium
ENV PORT=8080
EXPOSE 8080
CMD ["node", "lib/proxy-server.js"]
```

---

## 3. Entry Point — proxy-server.ts

**File:** `functions/src/proxy-server.ts`

- Creates an Express app with CORS middleware
- Calls `setupBrowserRoutes(app)` which registers all route modules
- Creates `http.createServer(app)` (**not** `app.listen`) so raw WebSocket upgrade events are accessible
- Attaches `server.on('upgrade')` handler to tunnel CDP WebSocket traffic to port 9222
- Starts the `backend-ai-orchestrator` on boot (the Firestore mission listener)

**Key design decision:** using `http.createServer` instead of `app.listen` is required for the CDP WebSocket proxy. Express's `app.listen` doesn't expose the underlying `http.Server` that WebSocket upgrades land on.

---

## 4. Browser Management — proxy-config.ts

**File:** `functions/src/proxy-config.ts`

### Chrome Launch Args

```
CHROME_SANDBOX_ARGS   — no-sandbox, no-zygote (required in containers)
CHROME_PERF_ARGS      — single-process, disable-gpu, mute-audio (memory savings)
CHROME_STEALTH_ARGS   — disable AutomationControlled, set window size, remote-debugging-port
```

### Singleton Lock Pattern

```typescript
let browserInstance: Browser | null = null;
let launchInProgress: Promise<Browser> | null = null;

export async function getBrowser(): Promise<Browser> {
    if (browserInstance?.isConnected()) return browserInstance;
    if (launchInProgress) return launchInProgress;  // dedup concurrent callers
    launchInProgress = (async () => {
        try {
            browserInstance = await chromium.launch({ headless: true, args: [...CHROME_DEFAULT_ARGS] });
            return browserInstance;
        } finally {
            launchInProgress = null;
        }
    })();
    return launchInProgress;
}
```

**Why this matters:** Cloud Run can have multiple concurrent requests arrive before Chrome finishes launching. Without `launchInProgress`, each caller would spawn its own Chrome, the second would fail to bind `--remote-debugging-port=9222` with `EADDRINUSE`, and Playwright would wait the full 180s timeout before throwing — killing the container.

---

## 5. Page Lifecycle — proxy-page-handler.ts

**File:** `functions/src/proxy-page-handler.ts`

### Per-Tab State

```
activeContexts  Map<tabId, BrowserContext>
activePages     Map<tabId, Page>
syncIntervals   Map<tabId, IntervalId>
```

Each tab gets its own **BrowserContext** (isolated cookies, storage, and fingerprint). This means multiple users/tabs are fully isolated even though they share one Chromium process.

### Stealth Context

Every context is created with:
```typescript
{
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
  viewport: { width: 1280, height: 800 },
  locale: 'en-US',
  timezoneId: 'America/New_York',
  extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' }
}
```

And an init script that runs before any page JS:
```javascript
Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
window.chrome = { runtime: {} };
```

This prevents Google, Cloudflare and other bot-detection systems from identifying Playwright.

### Periodic Sync

Every 5 seconds, `captureAndSync` fires for each open tab:
- Takes a JPEG screenshot (quality 60)
- Writes `{ screenshot, url, title, source: 'proxy' }` to Firestore `browser_tabs/{tabId}`
- The `source: 'proxy'` flag tells the Firestore listener on the frontend to ignore this write (breaks the self-echo loop)

### `captureAndSyncTab(tabId)`

Also exported for on-demand sync after any user action — called after every click, type, scroll etc so the frontend sees the result without waiting 5 seconds.

---

## 6. Navigation Guard — proxy-nav-controller.ts

**File:** `functions/src/proxy-nav-controller.ts`

### Per-Tab Mutex

```
navLocks     Map<tabId, boolean>   — true while a goto is in flight
settledUrls  Map<tabId, string>    — last known real URL after redirects
```

`guardedNavigate(page, tabId, url)` — the only safe way to navigate:
1. Returns 409 if lock held (prevents concurrent goto fighting)
2. Calls `page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })`
3. Resolves the final URL after all server-side redirects
4. Writes `source: 'proxy'` + `finalUrl` to Firestore (so the listener skips its own write)
5. Detects bot-checks and returns `isBotCheck: true` rather than re-navigating

### Bot-Check Detection

```typescript
const BOT_CHECK_PATTERNS = [
    /google\.com\/sorry/,
    /google\.com\/recaptcha/,
    /accounts\.google\.com\/ServiceLogin/,
    /cloudflare\.com\/challenge/,
    /hcaptcha\.com/,
    ...
];
```

When `isBotCheck: true` is returned, the frontend pauses the AI mission and asks the user to solve it manually (using the CDP DevTools link).

---

## 7. Route Map (Full API Reference)

### Health

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/health` | — | `{ status, activeTabs[], uptime }` |

### Navigation

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/proxy/navigate` | `{ url, tabId? }` | `{ finalUrl, wasRedirected, isBotCheck }` |
| DELETE | `/proxy/tab/:tabId` | — | `{ success }` |

### Screenshot

| Method | Path | Query | Response |
|--------|------|-------|----------|
| GET | `/screenshot` | `tabId?, url?` | `{ screenshot: "data:image/jpeg;base64,..." }` |
| GET | `/screenshot/stream` | `tabId?, url?` | SSE stream of base64 frames |

### Input Control

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/proxy/click` | `{ x, y, tabId? }` | Left click at viewport coords |
| POST | `/proxy/action` | `{ url, action, id, value, tabId? }` | Click/type by `data-ai-id` attribute |
| POST | `/proxy/type` | `{ text?, key?, tabId? }` | Keyboard type or press special key |
| POST | `/proxy/mouse/move` | `{ x, y, tabId? }` | Hover (no click) |
| POST | `/proxy/mouse/dblclick` | `{ x, y, tabId? }` | Double-click |
| POST | `/proxy/mouse/rightclick` | `{ x, y, tabId? }` | Right-click (context menu) |
| POST | `/proxy/mouse/scroll` | `{ x, y, deltaX?, deltaY?, tabId? }` | Scroll wheel |
| POST | `/proxy/mouse/drag` | `{ fromX, fromY, toX, toY, tabId? }` | Click-drag |

### DOM

| Method | Path | Query | Response |
|--------|------|-------|----------|
| GET | `/proxy/dom-map` | `tabId?, url?` | `{ map[], viewport, url }` |
| GET | `/proxy` | `url, tabId?` | Rewritten HTML page (for iframe embed) |

### AI Agent

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/agent/analyze` | `{ userId, goal, screenshot, hostname, ... }` | LLM decision (returns action steps) |
| POST | `/agent/plan` | `{ prompt, schemaPrompt? }` | LLM mission planning |
| POST | `/agent/deep-research/start` | `{ topic, taskId?, maxParallelSearches? }` | Start async research |
| POST | `/agent/deep-research/:taskId/stop` | — | Stop a running research task |
| GET | `/agent/deep-research/:taskId/report` | — | Final markdown report |
| GET | `/agent/deep-research/:taskId/plan` | — | Research plan progress |

### CDP (Chrome DevTools Protocol)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/cdp/info` | Browser WS URL + page list with DevTools frontend links |
| GET | `/cdp/json` | Raw CDP `/json` passthrough |
| GET | `/cdp/json/version` | Chrome version info |
| WS | `/cdp-proxy/*` | WebSocket tunnel to Chrome port 9222 |

---

## 8. Screenshot Streaming

**File:** `functions/src/proxy-routes-action.ts` — `setupScreenshotStreamRoute`

Uses **Server-Sent Events (SSE)** to push base64 JPEG frames at 800ms intervals:

```
GET /screenshot/stream?tabId=default

Response headers:
  Content-Type: text/event-stream
  Cache-Control: no-cache
  X-Accel-Buffering: no    ← prevents nginx/Cloud Run from buffering frames

Frame format:
  data: data:image/jpeg;base64,/9j/4AAQ...
  (blank line)
```

The frontend sets this as an `<img src>` and listens with `EventSource`. Each new frame replaces the previous one — giving a live view of the browser at ~1.25fps.

For one-shot screenshots (e.g. for the LLM), use `GET /screenshot` which returns a single frame as JSON.

---

## 9. Direct Input Control (Remote Mode)

The screenshot stream gives a live view. To interact with the browser remotely, the frontend maps pointer events on the `<img>` element to proxy coordinates and POSTs them to the input routes.

### Coordinate Mapping

The browser viewport is always `1280×800`. The screenshot is displayed at whatever size the `<img>` element renders. Scale the pointer position:

```typescript
// Frontend: map click on <img> to Playwright viewport coords
function toProxyCoords(e: PointerEvent, img: HTMLImageElement) {
    const rect = img.getBoundingClientRect();
    const scaleX = 1280 / rect.width;
    const scaleY = 800 / rect.height;
    return {
        x: Math.round((e.clientX - rect.left) * scaleX),
        y: Math.round((e.clientY - rect.top) * scaleY),
    };
}
```

### Available Input Routes

```
POST /proxy/click          — left click
POST /proxy/mouse/dblclick — double click
POST /proxy/mouse/rightclick — right click (context menus)
POST /proxy/mouse/move     — hover (triggers CSS :hover, tooltips, dropdowns)
POST /proxy/mouse/scroll   — scroll wheel
POST /proxy/mouse/drag     — click-drag (sliders, file uploads, sortables)
POST /proxy/type           — keyboard input (text or special keys)
```

### Special Keys (proxy/type `key` field)

Playwright key names: `Enter`, `Backspace`, `Tab`, `Escape`, `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Home`, `End`, `PageUp`, `PageDown`, `F5`, `Control+a`, `Control+c`, `Control+v`, etc.

---

## 10. CDP Bridge — Chrome DevTools Protocol

**File:** `functions/src/proxy-routes-cdp.ts` + `proxy-server.ts`

Chrome is launched with `--remote-debugging-port=9222`. The CDP JSON and WebSocket endpoints are tunnelled through the Cloud Run HTTPS endpoint:

### How to connect

```
GET /cdp/info
→ {
    browserWsUrl: "wss://your-cloudrun-host.run.app/cdp-proxy/...",
    pages: [{
        title: "Google",
        url: "https://www.google.com",
        devtoolsUrl: "https://chrome-devtools-frontend.appspot.com/...?wss=your-cloudrun-host.run.app/cdp-proxy/..."
    }]
  }
```

- **Desktop Chrome/Edge:** paste `devtoolsUrl` into the address bar
- **Mobile:** open `devtoolsUrl` in any browser (it's a hosted web app)
- **chrome://inspect:** add `your-cloudrun-host.run.app:443` as a target

### WebSocket Tunnel (proxy-server.ts)

```typescript
server.on('upgrade', (req, socket, head) => {
    if (!req.url?.startsWith('/cdp-proxy')) { socket.destroy(); return; }
    const cdpPath = req.url.replace('/cdp-proxy', '') || '/';
    const target = net.createConnection(9222, '127.0.0.1');
    target.on('connect', () => {
        // Rebuild HTTP upgrade headers targeting local CDP
        target.write(`GET ${cdpPath} HTTP/1.1\r\nHost: 127.0.0.1:9222\r\n...`);
    });
    socket.pipe(target);
    target.pipe(socket);
});
```

---

## 11. LLM Agent Routes

**File:** `functions/src/proxy-routes-agent.ts` + `features/llm/`

### POST /agent/analyze

The core AI endpoint. Takes a screenshot + ARIA snapshot + goal and returns structured action steps.

**Input:**
```json
{
  "userId": "user123",
  "goal": "Find today's top news on BBC",
  "screenshot": "<base64 jpeg>",
  "hostname": "www.bbc.com",
  "ariaSnapshot": "- heading 'BBC News'\n- link 'Top Stories'...",
  "context": { "groupId": "...", "contextId": "...", "unitId": "..." }
}
```

**Output:**
```json
{
  "execution": {
    "segments": [{
      "steps": [
        { "action": "click", "targetId": "link 'Top Stories'", "explanation": "Navigate to top stories" }
      ]
    }]
  },
  "meta": { "reasoning": "...", "intelligenceSignals": [] }
}
```

### LLM Model Config

```typescript
// functions/src/features/llm/llm-decision.engine.ts
const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
```

---

## 12. HTML Rewriting & Scanning

**File:** `functions/src/proxy-html.service.ts`, `proxy-scanner.ts`

When serving `GET /proxy?url=...`, the proxy:

1. **Navigates** Playwright to the URL (stealth context, real Chrome rendering)
2. **Assigns `data-ai-id`** attributes to all interactive elements (buttons, links, inputs)
3. **Rewrites HTML** — replaces all relative URLs with absolute so assets load correctly when the HTML is served from a different origin
4. **Injects a scanner script** — client-side JS that watches for dynamic content and reports element positions

This makes the raw HTML usable inside an `<iframe>` or `<webview>` and gives the AI stable element IDs to click.

---

## 13. Firestore Sync (optional)

The proxy is designed to work with or without Firestore. `captureAndSync` catches credential errors and disables itself gracefully:

```typescript
if (e.message.includes('credentials') || e.message.includes('Could not load the default')) {
    firestoreAvailable = false;
    console.warn('[Proxy] Firestore sync disabled. Use /screenshot route instead.');
}
```

**Without Firestore:** use `GET /screenshot` or `GET /screenshot/stream` directly.

**With Firestore:** set `GOOGLE_APPLICATION_CREDENTIALS` or deploy to GCP where the service account is auto-injected. The proxy writes to `browser_tabs/{tabId}`:

```
{
  screenshot: "data:image/jpeg;base64,...",
  url: "https://current-page.com",
  title: "Page Title",
  source: "proxy",        ← prevents echo loop
  last_sync: ISO timestamp
}
```

---

## 14. AI Mission Executor

**Files:** `functions/src/backend-ai-orchestrator.ts`, `backend-mission.executor.ts`, `playwright-mcp-adapter.ts`

The orchestrator watches Firestore `missions` collection for docs with `status: 'active'` and calls `processMissionStep` for each.

### ARIA Snapshot Technique (from @playwright/mcp)

Instead of using `data-ai-id` indices (brittle — change on DOM mutations), the mission executor uses Playwright's ARIA snapshot:

```typescript
const ariaSnapshot = await getAriaSnapshot(page);
// → "- heading 'Google'\n- textbox 'Search'\n- button 'Google Search'..."
```

The LLM returns steps using ARIA role+name selectors:
```json
{ "action": "click", "targetId": "button 'Google Search'", "role": "button", "name": "Google Search" }
```

These selectors are resolved at call time (`page.getByRole('button', { name: 'Google Search' })`), so they survive any DOM change from previous steps.

### Guards

- `MAX_STEPS = 50` — terminates after 50 LLM decision cycles
- `MAX_CONSECUTIVE_FAILURES = 3` — terminates after 3 back-to-back action failures
- Both counters are persisted in Firestore so re-triggers accumulate correctly

---

## 15. Environment Variables

| Variable | Where used | Required |
|----------|-----------|---------|
| `PORT` | proxy-server.ts | Auto-set by Cloud Run (default 3000) |
| `EXPO_PUBLIC_GEMINI_API_KEY` | llm-decision.engine.ts | **Yes** — LLM calls fail with 403 without it |
| `NODE_ENV` | General | Optional (set to `production`) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Firebase/Firestore | Optional — auto-injected on GCP |

**Critical:** `EXPO_PUBLIC_GEMINI_API_KEY` must be passed at deploy time:
```bat
--set-env-vars "NODE_ENV=production,EXPO_PUBLIC_GEMINI_API_KEY=your_key_here"
```

---

## 16. Deployment

### Cloud Run (deploy-cloudrun.bat)

```bat
gcloud builds submit ./functions --tag gcr.io/<PROJECT>/<SERVICE>
gcloud run deploy <SERVICE> \
    --image gcr.io/<PROJECT>/<SERVICE> \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --timeout 300 \
    --min-instances 0 \
    --max-instances 2 \
    --set-env-vars "NODE_ENV=production,EXPO_PUBLIC_GEMINI_API_KEY=..."
```

### Resource requirements

- **Memory:** 1Gi minimum (Chromium + Node.js + Playwright overhead)
- **CPU:** 1 vCPU minimum
- **Timeout:** 300s (LLM calls + page loads can take 30-60s each)
- **Concurrency:** Cloud Run default is 80 concurrent requests per instance — fine since we use a singleton browser

### Local development

```bash
cd functions
npm install
npm run build        # tsc → lib/
node lib/proxy-server.js
# Proxy available at http://localhost:3000
```

---

## 17. Adapting for a New Project

### Minimum viable standalone proxy

You need these files:
```
functions/
  src/
    proxy-server.ts          ← entry point
    proxy-config.ts          ← browser singleton
    proxy-page-handler.ts    ← page lifecycle
    proxy-nav-controller.ts  ← navigation guard
    proxy-routes-browser.ts  ← route hub
    proxy-routes-action.ts   ← click + screenshot
    proxy-routes-mouse.ts    ← full mouse control
    proxy-routes-type.ts     ← keyboard
    proxy-routes-nav.ts      ← navigation
    proxy-routes-cdp.ts      ← CDP bridge
    proxy-server.ts
    proxy-route.utils.ts     ← shared CORS helpers
    proxy-html.service.ts    ← HTML rewriting
    proxy-scanner.ts         ← DOM scanner injection
    proxy-asset.ts           ← static asset proxy
    proxy-dom-map.ts         ← DOM element map
    auth/
      firebase-config.ts     ← swap out or stub for no-Firebase use
  Dockerfile
  package.json
  tsconfig.json
```

### Remove Firebase dependency

Replace `auth/firebase-config.ts` with stubs:
```typescript
export const db = null;
export const auth = null;
```

Then in `proxy-page-handler.ts`, gate all `db.collection(...)` calls behind `if (db)`.

### Remove LLM dependency

Remove `proxy-routes-agent.ts` and its import from `proxy-routes-browser.ts`. The rest of the proxy (screenshot, navigation, mouse control, CDP) works entirely without the LLM.

### Change the viewport

In `proxy-page-handler.ts`:
```typescript
viewport: { width: 1920, height: 1080 },  // change here
```
And in `CHROME_STEALTH_ARGS` in `proxy-config.ts`:
```typescript
'--window-size=1920,1080',
```

And update your frontend coordinate scaling accordingly (see Section 9).

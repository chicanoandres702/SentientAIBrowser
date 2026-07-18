# Kilo — Agent with Inner Playwright MCP, Live Video & Planner

Kilo is a lightweight client that drives a **Kilo/OpenCode HTTP server**. It
replaces the old Cloud Run `sentient-proxy` (CDP tunnel + ffmpeg WebSocket
video). There is no proxy server, no ffmpeg, and no Cloud Run dependency —
Kilo just talks to the OpenCode server's HTTP + SSE API and uses Playwright
native recording for live video.

## What Kilo does

1. **Plans first.** Kilo asks the server's `plan` agent (or a local fallback
   parser) to turn a task prompt into an ordered step list. The plan is shown
   to the user before any browsing happens.
2. **Inner Playwright MCP connection.** Kilo registers `@playwright/mcp` as an
   MCP server with the Kilo server (`POST /mcp`). The model then auto-browses
   via `mcp__playwright__browser_*` tools — navigate, click, type, snapshot,
   screenshot — resolving the task step by step.
3. **Live browser video.** A separate Playwright context records the browser
   natively (`recordVideo`) and Kilo serves the live frames as MJPEG over HTTP.
   Open the printed URL in any browser to watch Kilo work in real time. No
   ffmpeg, no external streaming service.
4. **Streams progress.** Kilo listens to the server SSE event stream
   (`GET /event`) and reports step progress.

## Server

- **Kilo/OpenCode HTTP server:** `http://54.219.166.226:4096` (override with
  `KILO_SERVER_URL`). OpenAPI spec at `/doc`.
- The OpenAPI spec the server publishes matches
  `https://opencode.ai/docs/server/` — `opencode serve` exposes health,
  sessions, messages, MCP, and an SSE event stream.
- Built-in agents include `kilo` (default) and `plan`.
- Default model: `kilo-auto/balanced` (provider `kilo`).

### Running the server on a plain VM (no Cloud Run)

```bash
# Install OpenCode, then start the headless HTTP server bound to all interfaces
KILO_SERVER_PASSWORD=your-password bash kilo/serve.sh
# or directly:
opencode serve --hostname 0.0.0.0 --port 4096
```

Protect it with `OPENCODE_SERVER_PASSWORD` (HTTP basic auth). Kilo reads it via
`KILO_SERVER_PASSWORD`. A container image is provided in `kilo/Dockerfile`:

```bash
docker build -f kilo/Dockerfile -t kilo .
docker run -p 4096:4096 -e OPENCODE_SERVER_PASSWORD=your-password kilo
```

## Run Kilo

```bash
npm run kilo -- "Book a table for two at a restaurant in Paris tomorrow at 8pm"
```

Or directly:

```bash
node kilo/index.js "Your task here"
```

Preflight: Kilo checks `/global/health` first and fails fast with a clear
message if the server is down.

Environment overrides:

| Var | Default | Purpose |
| --- | --- | --- |
| `KILO_SERVER_URL` | `http://54.219.166.226:4096` | Kilo/OpenCode server base URL |
| `KILO_SERVER_PASSWORD` | – | HTTP basic auth password (username `KILO_SERVER_USERNAME`, default `opencode`) |
| `KILO_AGENT` | `kilo` | Agent used for the browse loop |
| `KILO_MODEL` | `kilo-auto/balanced` | Model id for the browse loop |
| `KILO_PROVIDER` | `kilo` | Provider for the browse loop |
| `KILO_VIDEO_PORT` | `8088` | Port for the live MJPEG video stream |
| `KILO_VIDEO_DIR` | `./kilo-videos` | Where Playwright writes recordings |

## Architecture

```
kilo/index.js            -> CLI entry point (health check -> plan -> browse)
kilo/health.js           -> no-dep preflight / container healthcheck
kilo/serve.sh            -> launches `opencode serve` on a plain server
kilo/core/kilo.js        -> orchestrator: health -> plan -> register MCP -> video -> browse loop
kilo/core/kilo-client.js -> typed HTTP + SSE client for the Kilo server
kilo/core/kilo-planner.js-> planner (server `plan` agent + local fallback)
kilo/core/kilo-browser-mcp.js -> registers inner Playwright MCP
kilo/core/kilo-browser-video.js-> Playwright-native video + MJPEG HTTP server
```

## API the server exposes (used by Kilo)

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

## Tests

```bash
npm run kilo:test
```

Covers the planner parser (pure unit), the live video MJPEG stream (real
Chromium, no external network), and a skippable integration test against the
live server.

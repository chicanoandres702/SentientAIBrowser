# Kilo — Agent with Inner Playwright MCP, Live Video & Planner

Kilo replaces the old `sentient-proxy`. Instead of a hand-rolled HTTP/WebSocket
proxy that tunnels Chrome DevTools Protocol, Kilo is an agent that drives the
Kilo/OpenCode server directly.

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
   Open the printed URL in any browser to watch Kilo work in real time.
4. **Streams progress.** Kilo listens to the server SSE event stream
   (`GET /event`) and updates the plan/todos as steps complete.

## Server

- **Kilo/OpenCode HTTP server:** `http://54.219.166.226:4096` (override with
  `KILO_SERVER_URL`). OpenAPI spec at `/doc`.
- Providers available: `google`, `kilo`, `openai`.
- Built-in agents include `kilo` (default) and `plan`.

## Run Kilo

```bash
npm run kilo -- "Book a table for two at a restaurant in Paris tomorrow at 8pm"
```

Or directly:

```bash
node kilo/index.js "Your task here"
```

Environment overrides:

| Var | Default | Purpose |
| --- | --- | --- |
| `KILO_SERVER_URL` | `http://54.219.166.226:4096` | Kilo/OpenCode server base URL |
| `KILO_SERVER_PASSWORD` | – | HTTP basic auth password (username `KILO_SERVER_USERNAME`, default `opencode`) |
| `KILO_VIDEO_PORT` | `8088` | Port for the live MJPEG video stream |
| `KILO_VIDEO_DIR` | `./kilo-videos` | Where Playwright writes recordings |

## Architecture

```
kilo/index.js            -> CLI entry point
kilo/core/kilo.js        -> orchestrator: plan -> register MCP -> video -> browse loop
kilo/core/kilo-client.js -> typed HTTP + SSE client for the Kilo server
kilo/core/kilo-planner.js-> planner (server `plan` agent + local fallback)
kilo/core/kilo-browser-mcp.js -> registers inner Playwright MCP
kilo/core/kilo-browser-video.js-> Playwright-native video + MJPEG HTTP server
```

## Tests

```bash
npm run test:kilo
```

Covers the planner parser, the live video MJPEG stream (real Chromium), and a
skippable integration test against the live server.

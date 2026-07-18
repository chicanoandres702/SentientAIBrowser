# Kilo — Agent with Planner, Live Viewer & Optional Browser MCP

Kilo is a **lightweight client** that drives an **OpenCode HTTP server** (`opencode
serve`). It replaces the old Cloud Run `sentient-proxy` (CDP tunnel + ffmpeg
WebSocket video). There is no proxy server, no ffmpeg, no Cloud Run, and no
external services — Kilo talks to the OpenCode server's HTTP + SSE API and shows
live progress through a tiny built-in web viewer. It is designed to run on any
plain Linux VM or container.

## What Kilo does

1. **Plans first (locally, by default).** Kilo decomposes the task into a short
   ordered step list on the client — no extra model round-trip, so it works even
   when the server is rate-limited. Set `KILO_PLANNER=server` to ask the server's
   `plan` agent instead (with a graceful local fallback).
2. **Optional inner Playwright MCP.** With `KILO_MCP=1`, Kilo registers
   `@playwright/mcp` with the server (`POST /mcp`) so the model can auto-browse
   via `mcp__playwright__browser_*` tools. Off by default — Kilo still runs
   without it.
3. **Lightweight live viewer.** Kilo serves a small HTML page that mirrors the
   plan, current step, and the model's streamed output over SSE. Open the
   printed URL to watch progress in real time. No browser, no ffmpeg, no external
   streaming service.
4. **Streams progress.** Kilo uses the server's async prompt + SSE event stream
   (`GET /event`) and resolves each turn on `session.turn.close`.

## Server (plain VM, no Cloud Run)

- **OpenCode HTTP server:** `http://54.219.166.226:4096` (override with
  `KILO_SERVER_URL`). OpenAPI spec at `/doc`.
- The server's API matches `https://opencode.ai/docs/server/` — `opencode serve`
  exposes health, sessions, messages, MCP, and an SSE event stream.
- Built-in agents include `kilo` (default). Default model/provider is the free
  `google/gemini-2.5-flash` so Kilo runs without paid credits.

### Launch the server on a plain server

```bash
# kilo/serve.sh installs `opencode` if missing, then starts the HTTP server.
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
| `KILO_SERVER_URL` | `http://54.219.166.226:4096` | OpenCode server base URL |
| `KILO_SERVER_PASSWORD` | – | HTTP basic auth password (username `KILO_SERVER_USERNAME`, default `opencode`) |
| `KILO_AGENT` | `kilo` | Agent used for the browse loop |
| `KILO_MODEL` | `gemini-2.5-flash` | Model id for the browse loop |
| `KILO_PROVIDER` | `google` | Provider for the browse loop |
| `KILO_PLANNER` | `local` | `local` (default, fast) or `server` (ask the plan agent) |
| `KILO_MCP` | – | set to `1` to register the inner Playwright MCP |
| `KILO_VIDEO_PORT` | `8088` | Port for the live viewer (auto-increments if busy) |

## Architecture

```
kilo/index.js               -> CLI entry point (health -> plan -> browse)
kilo/health.js              -> no-dep preflight / container healthcheck
kilo/serve.sh               -> launches `opencode serve` on a plain server
kilo/core/kilo.js           -> orchestrator: health -> plan -> (MCP) -> viewer -> browse loop
kilo/core/kilo-client.js    -> typed HTTP + SSE client (prompt() waits on turn.close)
kilo/core/kilo-planner.js   -> local planner (fast) + optional server planner
kilo/core/kilo-browser-mcp.js -> registers inner Playwright MCP (optional, server-side)
kilo/core/kilo-browser-video.js -> lightweight SSE live viewer (no Playwright/ffmpeg)
```

## API the server exposes (used by Kilo)

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/global/health` | health/version |
| GET | `/config/providers` | provider + model IDs |
| GET | `/agent` | list agents (incl. `kilo`) |
| POST | `/session` | create a session |
| POST | `/session/:id/prompt_async` | send a prompt, respond 204 |
| GET | `/session/:id/message` | read messages |
| POST | `/mcp` | register the inner Playwright MCP |
| GET | `/mcp` | MCP connection status |
| GET | `/event` | SSE stream of progress |

## Tests

```bash
npm run kilo:test
```

Covers the planner parser (pure unit) and a skippable integration test against
the live server (skips automatically when the server is offline).

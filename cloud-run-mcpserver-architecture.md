# Kilo — Architecture (replaces the old Cloud Run sentient-proxy)

> The old `sentient-proxy` (CDP tunnel + ffmpeg WebSocket video) has been
> replaced by **Kilo**, a lightweight client for a Kilo/OpenCode HTTP server.
> This file records the architectural shift. There is no proxy server, no
> ffmpeg, and no Cloud Run dependency.

---

## What changed

- **No more proxy server.** There is no `proxy-server.js` to run. `start-proxy.sh`
  and `run-proxy.ps1` were removed.
- **Kilo drives the Kilo/OpenCode HTTP server directly** (`POST /session`,
  `POST /session/:id/message`, `GET /event` SSE, `POST /mcp`). The server is
  `opencode serve` — an OpenCode headless HTTP server (see
  https://opencode.ai/docs/server/). OpenAPI spec at `/doc`.
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
kilo/core/kilo.js            -> orchestrator (health -> plan -> MCP -> video -> browse)
kilo/core/kilo-client.js     -> HTTP + SSE client (model.id field, basic auth)
kilo/core/kilo-planner.js    -> planner (server `plan` agent + local fallback)
kilo/core/kilo-browser-mcp.js-> inner Playwright MCP registration
kilo/core/kilo-browser-video.js-> Playwright-native video + MJPEG server
kilo/health.js               -> no-dependency preflight / healthcheck
kilo/serve.sh                -> launches `opencode serve` on a plain server
kilo/Dockerfile              -> plain-server container (no Cloud Run specifics)
```

## Server (not Cloud Run)

Kilo is designed to run on a **plain Linux server / VM**:

- Start the server: `opencode serve --hostname 0.0.0.0 --port 4096`
  (helper: `bash kilo/serve.sh`).
- Protect it with `OPENCODE_SERVER_PASSWORD` (HTTP basic auth).
- Kilo connects over the network via `KILO_SERVER_URL`.
- A container build is provided in `kilo/Dockerfile` for Docker/Podman hosts.
- No GCP, no ffmpeg, no WebSocket CDP tunnel, no external streaming service.

## Notes

- All heavy lifting (model calls, MCP tool execution) happens **on the
  OpenCode server**; Kilo itself is a thin, dependency-light client.
- Live video is local Playwright recording served as MJPEG — no transcoding
  dependencies beyond Chromium.
- If the server, planner, or MCP is unavailable, Kilo degrades gracefully
  (local-plan fallback, MCP fallback) instead of crashing.

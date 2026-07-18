// kilo/core/kilo-client.js
// Feature: Kilo Core | Trace: kilo/core/kilo-client.js
// Why: Thin HTTP + SSE client for the Kilo/OpenCode server. Replaces the old
// sentient-proxy HTTP/WebSocket layer with a single typed client. Every other
// kilo module talks to the server only through this file.
"use strict";

const BASE_URL = process.env.KILO_SERVER_URL || "http://54.219.166.226:4096";
// Default agent/model. The Kilo OpenCode server exposes a native `kilo` agent
// and a `kilo` provider (model `kilo-auto/balanced`). Falls back gracefully if
// the server replaces these with its own defaults.
const DEFAULT_AGENT = process.env.KILO_AGENT || "kilo";
// Default to a free, text-capable model so Kilo works out of the box without
// paid provider credits. Override with KILO_MODEL / KILO_PROVIDER.
const DEFAULT_MODEL = process.env.KILO_MODEL || "gemini-2.5-flash";
const DEFAULT_PROVIDER = process.env.KILO_PROVIDER || "google";
const API_KEY = process.env.KILO_SERVER_PASSWORD;

function authHeaders() {
  const h = { "content-type": "application/json" };
  if (API_KEY) {
    // Server uses HTTP basic auth (username defaults to "opencode").
    const user = process.env.KILO_SERVER_USERNAME || "opencode";
    const token = Buffer.from(`${user}:${API_KEY}`).toString("base64");
    h["authorization"] = `Basic ${token}`;
  }
  return h;
}

async function request(method, path, body, timeoutMs = 90000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: authHeaders(),
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") throw new Error(`Kilo ${method} ${path} timed out after ${timeoutMs}ms`);
    throw err;
  }
  clearTimeout(timer);
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    const msg = typeof data === "string" ? data : JSON.stringify(data);
    throw new Error(`Kilo ${method} ${path} failed (${res.status}): ${msg}`);
  }
  return data;
}

class KiloClient {
  constructor(baseUrl = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  health() {
    return request("GET", "/global/health", undefined, 10000);
  }

  providers() {
    return request("GET", "/config/providers");
  }

  agents() {
    return request("GET", "/agent");
  }

  mcpStatus() {
    return request("GET", "/mcp");
  }

  async registerMcp(name, config, timeoutMs = 20000) {
    return request("POST", "/mcp", { name, config }, timeoutMs);
  }

  // Normalize any model input ({id} | {modelID}) into the shape a given
  // endpoint expects. The OpenCode server is inconsistent across routes:
  //   - POST /session          requires `model.id` + `providerID`
  //   - POST /session/:id/msg  requires `model.modelID` + `providerID`
  // `kind` selects the right field name so we never send an unknown key
  // (the server rejects extra properties).
  _model(input, kind) {
    const m = input || {};
    const id = m.id || m.modelID || DEFAULT_MODEL;
    const providerID = m.providerID || DEFAULT_PROVIDER;
    if (kind === "message") return { modelID: id, providerID };
    return { id, providerID };
  }

  createSession(opts = {}) {
    const model = this._model(opts.model, "session");
    const agent = opts.agent || DEFAULT_AGENT;
    return request("POST", "/session", {
      title: opts.title || "kilo task",
      agent,
      model,
    });
  }

  getSession(id) {
    return request("GET", `/session/${id}`);
  }

  deleteSession(id) {
    return request("DELETE", `/session/${id}`);
  }

  listMessages(id, limit = 50) {
    return request("GET", `/session/${id}/message?limit=${limit}`);
  }

  getTodo(id) {
    return request("GET", `/session/${id}/todo`);
  }

  // Synchronous: waits for the assistant to finish and returns { info, parts }.
  sendMessage(id, parts, opts = {}) {
    const body = {
      parts,
      model: this._model(opts.model, "message"),
      agent: opts.agent || DEFAULT_AGENT,
      tools: opts.tools || undefined,
    };
    return request("POST", `/session/${id}/message`, body);
  }

  // Async: fire-and-forget; completion arrives over the SSE stream.
  promptAsync(id, parts, opts = {}) {
    const body = {
      parts,
      model: this._model(opts.model, "message"),
      agent: opts.agent || DEFAULT_AGENT,
      tools: opts.tools || undefined,
    };
    return request("POST", `/session/${id}/prompt_async`, body);
  }

  // Run a full turn and resolve with the assistant's text once the turn closes.
  // The synchronous `POST /session/:id/message` does NOT block on the server we
  // target, so we fire `prompt_async` and collect parts from the SSE stream
  // until `session.turn.close`. Resolves { text, parts, error }.
  prompt(id, parts, opts = {}) {
    const agent = opts.agent || DEFAULT_AGENT;
    const model = this._model(opts.model, "message");
    const tools = opts.tools || undefined;
    let resolveTurn;
    let rejectTurn;
    const done = new Promise((res, rej) => {
      resolveTurn = res;
      rejectTurn = rej;
    });
    let text = "";
    let lastParts = [];
    let errored = null;
    const stream = this.openEventStream({
      "message.part.updated": (props) => {
        const part = props?.part;
        if (!part) return;
        lastParts.push(part);
        if (part.type === "text" && typeof part.text === "string") text += part.text;
      },
      "session.error": (props) => {
        errored = props?.error || props?.message || "session error";
      },
      "session.turn.close": (props) => {
        if (props?.sessionID && props.sessionID !== id) return;
        finish();
      },
      _error: (err) => rejectTurn(err),
    });

    const timeoutMs = opts.timeoutMs || 180000;
    const timer = setTimeout(() => finish(new Error("prompt timed out")), timeoutMs);

    function finish(err) {
      clearTimeout(timer);
      try {
        stream.close();
      } catch {
        /* ignore */
      }
      if (err) return rejectTurn(err);
      if (errored) return rejectTurn(new Error(String(errored)));
      resolveTurn({ text: text.trim(), parts: lastParts });
    }

    // Fire the turn. If the request itself fails, reject immediately.
    this.promptAsync(id, parts, { agent, model, tools }).catch((err) => {
      clearTimeout(timer);
      rejectTurn(err);
    });

    return done;
  }

  diff(id, messageID) {
    const q = messageID ? `?messageID=${messageID}` : "";
    return request("GET", `/session/${id}/diff${q}`);
  }

  // Open the SSE event stream and dispatch by event type.
  // handlers: { [type]: (properties) => void }
  openEventStream(handlers = {}) {
    const url = `${this.baseUrl}/event`;
    // Node 18+ global fetch supports reading the body as a stream.
    const ctrl = new AbortController();
    const events = [];
    (async () => {
      try {
        const res = await fetch(url, { headers: authHeaders(), signal: ctrl.signal });
        if (!res.ok || !res.body) {
          handlers._error?.(new Error(`event stream status ${res.status}`));
          return;
        }
        const decoder = new TextDecoder();
        let buffer = "";
        for await (const chunk of res.body) {
          buffer += decoder.decode(chunk, { stream: true });
          let idx;
          while ((idx = buffer.indexOf("\n\n")) !== -1) {
            const raw = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            const line = raw.split("\n").find((l) => l.startsWith("data:"));
            if (!line) continue;
            const payload = line.slice(5).trim();
            if (!payload) continue;
            try {
              const ev = JSON.parse(payload);
              events.push(ev);
              const fn = handlers[ev.type];
              if (fn) fn(ev.properties, ev);
            } catch {
              /* ignore malformed */
            }
          }
        }
      } catch (err) {
        if (err.name !== "AbortError") handlers._error?.(err);
      }
    })();
    return {
      close: () => ctrl.abort(),
      events,
    };
  }
}

module.exports = { KiloClient, BASE_URL, authHeaders, request };

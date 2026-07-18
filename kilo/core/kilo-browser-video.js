// kilo/core/kilo-browser-video.js
// Feature: Kilo Live Viewer | Trace: kilo/core/kilo-browser-video.js
// Why: The user wants to SEE kilo work in real time. The model drives a browser
// on the *server* (via the Playwright MCP), so the client does not need its own
// browser. Instead we serve a tiny HTTP page that mirrors kilo's live plan, step
// progress, and the model's streamed text over a lightweight SSE channel. No
// Playwright, no ffmpeg, no external streaming service — just Node's stdlib.
"use strict";

const http = require("http");

class KiloBrowserVideo {
  constructor(opts = {}) {
    this.port = opts.port || parseInt(process.env.KILO_VIDEO_PORT || "8088", 10);
    this.server = null;
    this.clients = new Set();
    this.state = {
      task: "",
      plan: [],
      stepIndex: -1,
      stepText: "",
      log: [],
    };
  }

  async start() {
    await this._startServer();
    return this;
  }

  // --- live state updates (called by kilo.js) -------------------------------
  setTask(task) {
    this.state.task = task;
    this._broadcast();
  }

  setPlan(plan) {
    this.state.plan = plan.map((s) => ({ content: s.content, status: s.status || "pending" }));
    this._broadcast();
  }

  setStep(index, step) {
    this.state.stepIndex = index;
    this.state.stepText = step?.content || "";
    this.state.plan[index] = { ...(this.state.plan[index] || {}), content: step?.content, status: step?.status || "in_progress" };
    this._broadcast();
  }

  appendOutput(text) {
    if (!text) return;
    const lines = String(text).split("\n").filter(Boolean);
    for (const l of lines) this.state.log.push(l);
    if (this.state.log.length > 200) this.state.log = this.state.log.slice(-200);
    this._broadcast();
  }

  // --- http + sse -----------------------------------------------------------
  _startServer() {
    this.server = http.createServer((req, res) => {
      if (req.url === "/stream") return this._serveSse(req, res);
      if (req.url === "/state") {
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(this.state));
      }
      if (req.url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ ok: true, clients: this.clients.size }));
      }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(HTML);
    });
    // Bind, but if the configured port is busy (e.g. a leftover viewer from a
    // previous run) walk upward to the next free port so Kilo never crashes.
    return new Promise((resolve, reject) => {
      const tryPort = (port) => {
        this.server.once("error", (err) => {
          if (err.code === "EADDRINUSE" && port < this.port + 100) {
            tryPort(port + 1);
          } else {
            reject(err);
          }
        });
        this.server.listen(port, () => {
          this.port = port;
          resolve(this);
        });
      };
      tryPort(this.port);
    });
  }

  _serveSse(req, res) {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    const send = () => res.write(`data: ${JSON.stringify(this.state)}\n\n`);
    send();
    this.clients.add(send);
    req.on("close", () => this.clients.delete(send));
  }

  _broadcast() {
    for (const send of this.clients) {
      try {
        send();
      } catch {
        /* drop dead client */
      }
    }
  }

  url() {
    return `http://localhost:${this.port}/`;
  }

  async stop() {
    this.clients.clear();
    if (this.server) await new Promise((r) => this.server.close(r));
  }
}

const HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Kilo — Live</title>
<style>
  :root { color-scheme: dark; }
  body { margin:0; font:14px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace; background:#0b0e14; color:#d6deeb; }
  header { padding:14px 18px; background:#11151f; border-bottom:1px solid #1d2430; }
  header h1 { margin:0; font-size:16px; letter-spacing:.5px; }
  main { display:grid; grid-template-columns: 320px 1fr; gap:1px; background:#1d2430; height:calc(100vh - 52px); }
  .col { background:#0b0e14; padding:16px; overflow:auto; }
  h2 { font-size:12px; text-transform:uppercase; letter-spacing:1px; color:#7f8ea3; margin:0 0 10px; }
  .task { color:#82aaff; margin-bottom:14px; }
  .step { padding:8px 10px; border-left:3px solid #1d2430; margin-bottom:6px; color:#7f8ea3; }
  .step.active { border-color:#82aaff; color:#d6deeb; background:#11151f; }
  .step.done { border-color:#7fd17f; color:#9fb3c8; }
  .step.error { border-color:#ec6a88; color:#ec6a88; }
  #log { white-space:pre-wrap; color:#c3e88d; }
  .now { color:#82aaff; margin-bottom:10px; min-height:1.5em; }
</style></head>
<body>
<header><h1>● Kilo <span style="color:#7f8ea3;font-weight:400">live agent</span></h1></header>
<main>
  <div class="col">
    <h2>Plan</h2>
    <div class="task" id="task"></div>
    <div id="plan"></div>
  </div>
  <div class="col">
    <h2>Current step</h2>
    <div class="now" id="now"></div>
    <h2>Agent output</h2>
    <div id="log"></div>
  </div>
</main>
<script>
  const es = new EventSource("/stream");
  const $ = (id) => document.getElementById(id);
  es.onmessage = (e) => {
    const s = JSON.parse(e.data);
    $("task").textContent = s.task || "";
    $("now").textContent = s.stepText || "";
    $("plan").innerHTML = (s.plan || []).map((p, i) => {
      const cls = i === s.stepIndex ? "step active" : (p.status === "completed" ? "step done" : p.status === "pending" ? "step" : "step");
      return '<div class="'+cls+'">'+ (i+1) +". "+ (p.content||"") +'</div>';
    }).join("");
    $("log").textContent = (s.log || []).join("\\n");
    $("log").scrollTop = $("log").scrollHeight;
  };
</script>
</body></html>`;

module.exports = { KiloBrowserVideo };

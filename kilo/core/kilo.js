// kilo/core/kilo.js
// Feature: Kilo Agent | Trace: kilo/core/kilo.js
// Why: Top-level orchestrator. Replaces the sentient-proxy. Flow:
//   1. plan(task)        -> structured step list (planner)
//   2. register Playwright MCP -> inner browser connection
//   3. start live video  -> user can watch at kilo.url()
//   4. loop: for each step, drive the model (with playwright tools) to act,
//      sync the video page, update todos, stream progress.
"use strict";

const { KiloClient } = require("./kilo-client");
const { KiloPlanner } = require("./kilo-planner");
const { KiloBrowserMcp } = require("./kilo-browser-mcp");
const { KiloBrowserVideo } = require("./kilo-browser-video");

const DEFAULT_MODEL = process.env.KILO_MODEL || "gemini-2.5-flash";
const DEFAULT_PROVIDER = process.env.KILO_PROVIDER || "google";
const DEFAULT_AGENT = process.env.KILO_AGENT || "kilo";

class Kilo {
  constructor(opts = {}) {
    this.client = opts.client || new KiloClient();
    this.planner = new KiloPlanner(this.client);
    this.browserMcp = new KiloBrowserMcp(this.client);
    this.video = new KiloBrowserVideo(opts.video || {});
    this.model = opts.model || { id: DEFAULT_MODEL, providerID: DEFAULT_PROVIDER };
    this.agent = opts.agent || DEFAULT_AGENT;
    this.onStep = opts.onStep || (() => {});
    this.onEvent = opts.onEvent || (() => {});
    this.taskSessionId = null;
    this.plan = [];
    this.stopped = false;
  }

  // Lightweight preflight: confirm the server is reachable before we spin up
  // the browser/video. Returns false (without throwing) if the server is down.
  async healthCheck() {
    try {
      const h = await this.client.health();
      return !!(h && h.healthy === true);
    } catch {
      return false;
    }
  }

  async run(taskPrompt) {
    // 0. Preflight — fail fast with a clear message if the server is down.
    if (!(await this.healthCheck())) {
      throw new Error(
        `Kilo server unreachable at ${this.client.baseUrl} (set KILO_SERVER_URL). ` +
          `Start it with: opencode serve --hostname 0.0.0.0 --port 4096`
      );
    }

    // 1. Plan first — kilo always makes a plan. If the server planner is
    // unreachable, fall back to a local single-step plan so kilo still runs.
    let planResult;
    try {
      planResult = await this.planner.plan(taskPrompt, { model: this.model, agent: this.agent });
    } catch (err) {
      this.onEvent({ type: "plan-fallback", error: err.message });
      planResult = { steps: [{ content: taskPrompt, status: "pending", priority: "medium" }] };
    }
    this.plan = planResult.steps;

    // 2. Optional inner Playwright MCP connection (server-side). It is opt-in
    // via KILO_MCP=1 because launching it on the server can be slow/rate-limited.
    // Kilo still runs fine without it — the model can answer or use other tools.
    this.mcpEnabled = false;
    if (process.env.KILO_MCP === "1") {
      try {
        await this.browserMcp.register();
        this.mcpEnabled = true;
      } catch (err) {
        this.onEvent({ type: "mcp-fallback", error: err.message });
      }
    }

    // 3. Start the lightweight live viewer (plan + progress over SSE).
    this.video.setTask(taskPrompt);
    this.video.setPlan(this.plan);
    await this.video.start();

    // 4. Task session that will actually browse.
    const session = await this.client.createSession({
      title: `kilo: ${taskPrompt.slice(0, 40)}`,
      agent: this.agent,
      model: this.model,
    });
    this.taskSessionId = session.id || session.info?.id;

    // Tool enablement: only expose the inner Playwright MCP tools when it was
    // actually registered, otherwise send no `tools` map (avoids server errors
    // about unknown tools).
    let tools;
    if (this.mcpEnabled) {
      const toolPrefix = this.browserMcp.toolPrefix();
      tools = { [`${toolPrefix}browser_navigate`]: true, [`${toolPrefix}browser_click`]: true, [`${toolPrefix}browser_type`]: true, [`${toolPrefix}browser_snapshot`]: true, [`${toolPrefix}browser_take_screenshot`]: true };
    }

    const results = [];
    for (let i = 0; i < this.plan.length && !this.stopped; i++) {
      const step = this.plan[i];
      step.status = "in_progress";
      this.video.setStep(i, step);
      this.onStep({ index: i, step, total: this.plan.length });

      const browserLine = this.mcpEnabled
        ? `You have an inner Playwright browser connected via tools (browser_navigate, browser_click, browser_type, browser_snapshot, browser_take_screenshot). Execute this step by driving the browser. `
        : `Complete this step using the tools and knowledge available to you. `;
      const prompt =
        browserLine +
        `Step ${i + 1}/${this.plan.length}: ${step.content}\n\n` +
        `Overall task: ${taskPrompt}\n` +
        `When the step is done, reply with a one-line summary of what you did.`;

      try {
        const r = await this.client.prompt(
          this.taskSessionId,
          [{ type: "text", text: prompt }],
          { model: this.model, agent: this.agent, tools, timeoutMs: 90000 }
        );
        step.status = "completed";
        this.video.setStep(i, step);
        this.video.appendOutput(r.text);
        results.push({ step: step.content, result: summarize(r.text) });
        this.onEvent({ type: "step-done", index: i, result: summarize(r.text) });
      } catch (err) {
        step.status = "pending";
        this.video.setStep(i, step);
        this.onEvent({ type: "step-error", index: i, error: err.message });
      }
    }

    return {
      plan: this.plan,
      results,
      videoUrl: this.video.url(),
      sessionId: this.taskSessionId,
    };
  }

  async stop() {
    this.stopped = true;
    if (this.taskSessionId) {
      try {
        await this.client.deleteSession(this.taskSessionId);
      } catch {
        /* ignore */
      }
    }
    await this.video.stop();
  }
}

function summarize(text) {
  if (!text) return "";
  return String(text).trim().slice(0, 500);
}

module.exports = { Kilo };

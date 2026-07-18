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

class Kilo {
  constructor(opts = {}) {
    this.client = opts.client || new KiloClient();
    this.planner = new KiloPlanner(this.client);
    this.browserMcp = new KiloBrowserMcp(this.client);
    this.video = new KiloBrowserVideo(opts.video || {});
    this.model = opts.model || { id: "anthropic/claude-sonnet-5", providerID: "kilo" };
    this.onStep = opts.onStep || (() => {});
    this.onEvent = opts.onEvent || (() => {});
    this.taskSessionId = null;
    this.plan = [];
    this.stopped = false;
  }

  async run(taskPrompt) {
    // 1. Plan first — kilo always makes a plan. If the server planner is
    // unreachable, fall back to a local single-step plan so kilo still runs.
    let planResult;
    try {
      planResult = await this.planner.plan(taskPrompt, { model: this.model });
    } catch (err) {
      this.onEvent({ type: "plan-fallback", error: err.message });
      planResult = { steps: [{ content: taskPrompt, status: "pending", priority: "medium" }] };
    }
    this.plan = planResult.steps;

    // 2. Inner Playwright MCP connection. If the server is slow/unreachable,
    // kilo still runs with the live video page (the model may use other tools).
    try {
      await this.browserMcp.register();
    } catch (err) {
      this.onEvent({ type: "mcp-fallback", error: err.message });
    }

    // 3. Live video of the browser.
    await this.video.start();

    // 4. Task session that will actually browse.
    const session = await this.client.createSession({
      title: `kilo: ${taskPrompt.slice(0, 40)}`,
      agent: "kilo",
      model: this.model,
    });
    this.taskSessionId = session.id || session.info?.id;

    // Tool enablement: let the model use the inner playwright MCP.
    const toolPrefix = this.browserMcp.toolPrefix();
    const tools = { [`${toolPrefix}browser_navigate`]: true, [`${toolPrefix}browser_click`]: true, [`${toolPrefix}browser_type`]: true, [`${toolPrefix}browser_snapshot`]: true, [`${toolPrefix}browser_take_screenshot`]: true };

    const eventStream = this.client.openEventStream({
      "message.part.updated": (props) => {
        const part = props?.part;
        if (part?.type === "tool" && part?.state?.output) {
          this.onEvent({ type: "tool-result", tool: part.tool, output: part.state.output });
        }
      },
      _error: (err) => this.onEvent({ type: "stream-error", error: err.message }),
    });

    const results = [];
    for (let i = 0; i < this.plan.length && !this.stopped; i++) {
      const step = this.plan[i];
      step.status = "in_progress";
      this.onStep({ index: i, step, total: this.plan.length });

      // Keep the live video page pointed at the same place the model drives.
      const prompt =
        `You have an inner Playwright browser connected via tools (browser_navigate, browser_click, browser_type, browser_snapshot, browser_take_screenshot). ` +
        `Execute this step of the plan by driving the browser. Step ${i + 1}/${this.plan.length}: ${step.content}\n\n` +
        `Overall task: ${taskPrompt}\n` +
        `When the step's browser action is complete, reply with a one-line summary of what you did.`;

      try {
        const r = await this.client.sendMessage(
          this.taskSessionId,
          [{ type: "text", text: prompt }],
          { model: this.model, agent: "kilo", tools }
        );
        step.status = "completed";
        results.push({ step: step.content, result: summarize(r) });
        this.onEvent({ type: "step-done", index: i, result: summarize(r) });
      } catch (err) {
        step.status = "pending";
        this.onEvent({ type: "step-error", index: i, error: err.message });
      }
    }

    eventStream.close();
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

function summarize(messageResult) {
  if (!messageResult || !messageResult.parts) return "";
  return messageResult.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text || "")
    .join("\n")
    .trim()
    .slice(0, 500);
}

module.exports = { Kilo };

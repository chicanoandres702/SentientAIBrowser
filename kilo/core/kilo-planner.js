// kilo/core/kilo-planner.js
// Feature: Kilo Planner | Trace: kilo/core/kilo-planner.js
// Why: Kilo always plans before it browses. It asks the server's `plan` agent
// (or a fallback local decomposition) to turn a task prompt into an ordered
// list of steps. The plan is pushed to the session todo list so the user can
// watch progress, and returned for the browse loop to execute.
"use strict";

const { KiloClient } = require("./kilo-client");

function parsePlanFromText(text) {
  // Fallback: derive a numbered/checked plan from free text. Lines that look
  // like steps (start with a number, "-", "*", or "[]"/"[ ]") become steps.
  const lines = String(text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const steps = [];
  for (const line of lines) {
    const m = line.match(/^(?:\d+[.)]|[-*]|\[[ xX]\]|#+)\s*(.*)$/);
    const body = m ? m[1] : line;
    if (body.length < 3) continue;
    steps.push({ content: body.replace(/^\[[ xX]\]\s*/, ""), status: "pending", priority: "medium" });
  }
  return steps.length ? steps : [{ content: String(text).slice(0, 200), status: "pending", priority: "medium" }];
}

class KiloPlanner {
  constructor(client = new KiloClient()) {
    this.client = client;
  }

  // Ask the server planner agent to produce a structured plan.
  // Returns { steps: [{content,status,priority}], raw }.
  async plan(taskPrompt, opts = {}) {
    // The `plan` agent plans best but may write to a plan file (empty chat
    // reply). If it returns no usable steps we fall back to treating the whole
    // task as a single step rather than blocking on a slower planning agent.
    const agent = opts.agent || "plan";
    const session = await this.client.createSession({
      agent,
      title: `plan: ${taskPrompt.slice(0, 40)}`,
      model: opts.model,
    });
    const sessionId = session.id || session.info?.id;
    try {
      const res = await this.client.sendMessage(
        sessionId,
        [{ type: "text", text: `Create a concise step-by-step plan to accomplish this task. Return only the ordered steps, one per line.\n\nTask: ${taskPrompt}` }],
        { agent, model: opts.model }
      );
      const text = extractText(res);
      const steps = parsePlanFromText(text);
      if (steps.length && steps[0].content) {
        return { steps, raw: text, sessionId, agent };
      }
    } finally {
      try {
        await this.client.deleteSession(sessionId);
      } catch {
        /* ignore */
      }
    }
    // Fallback: the whole task is a single step.
    return { steps: [{ content: taskPrompt, status: "pending", priority: "medium" }], raw: "" };
  }
}

function extractText(messageResult) {
  if (!messageResult) return "";
  const parts = messageResult.parts || [];
  return parts
    .filter((p) => p.type === "text")
    .map((p) => p.text || "")
    .join("\n")
    .trim();
}

module.exports = { KiloPlanner, parsePlanFromText };

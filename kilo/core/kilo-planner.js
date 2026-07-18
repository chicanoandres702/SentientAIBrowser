// kilo/core/kilo-planner.js
// Feature: Kilo Planner | Trace: kilo/core/kilo-planner.js
// Why: Kilo always plans before it browses. Planning is intentionally LIGHT:
// by default it decomposes the task locally (no extra server round-trip, no
// rate-limit risk). Set KILO_PLANNER=server to ask the server's `plan` agent
// instead. Either way the plan is returned for the browse loop to execute and
// is mirrored to the live viewer.
"use strict";

const { KiloClient } = require("./kilo-client");

// Turn a free-text task into a small list of browser-oriented steps locally.
// This is fast, deterministic, and never hits the model API, so it works even
// when the server is rate-limited. The model still does the real work later.
function localPlan(taskPrompt) {
  const task = String(taskPrompt || "").trim();
  const steps = [];

  // If the task already reads like a list of steps, keep those steps.
  const enumerated = task
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^\d+[.)]\s+/.test(l));
  if (enumerated.length >= 2) {
    for (const l of enumerated) {
      const body = l.replace(/^\d+[.)]\s+/, "").trim();
      if (body.length >= 3) steps.push({ content: body, status: "pending", priority: "medium" });
    }
    return steps.slice(0, 8);
  }

  // Otherwise produce a generic browse workflow around the task.
  steps.push({ content: `Open a new browser tab and navigate to a search engine`, status: "pending", priority: "high" });
  steps.push({ content: `Search for: ${task}`, status: "pending", priority: "high" });
  steps.push({ content: `Review the top results and open the most relevant page`, status: "pending", priority: "medium" });
  steps.push({ content: `Carry out the task: ${task}`, status: "pending", priority: "medium" });
  steps.push({ content: `Summarize what was accomplished`, status: "pending", priority: "low" });
  return steps;
}

class KiloPlanner {
  constructor(client = new KiloClient()) {
    this.client = client;
    this.mode = (process.env.KILO_PLANNER || "local").toLowerCase();
  }

  // Returns { steps: [{content,status,priority}], raw, mode }.
  async plan(taskPrompt, opts = {}) {
    if (this.mode !== "server") {
      return { steps: localPlan(taskPrompt), raw: "", mode: "local" };
    }

    // Server-assisted planning (optional, may be rate-limited).
    const agent = opts.agent || "plan";
    const model = opts.model || { id: process.env.KILO_MODEL || "gemini-2.5-flash", providerID: process.env.KILO_PROVIDER || "google" };
    const session = await this.client.createSession({ agent, title: `plan: ${taskPrompt.slice(0, 40)}`, model });
    const sessionId = session.id || session.info?.id;
    try {
      const res = await this.client.prompt(
        sessionId,
        [{ type: "text", text: `Break the following task into 3-6 short, actionable browser steps. Reply with ONLY a numbered list (e.g. "1. Open Google") and no preamble.\n\nTask: ${taskPrompt}` }],
        { agent, model, timeoutMs: opts.timeoutMs || 60000 }
      );
      const steps = parsePlanFromText(res.text, taskPrompt);
      if (steps.length && steps[0].content) return { steps, raw: res.text, sessionId, agent, mode: "server" };
    } catch (err) {
      this.onPlanError?.(err);
    } finally {
      try {
        await this.client.deleteSession(sessionId);
      } catch {
        /* ignore */
      }
    }
    // Degrade gracefully to a local plan rather than blocking the run.
    return { steps: localPlan(taskPrompt), raw: "", mode: "local-fallback" };
  }
}

function parsePlanFromText(text, taskPrompt = "") {
  const taskLc = String(taskPrompt || "").trim().toLowerCase();
  const lines = String(text || "").split("\n").map((l) => l.trim()).filter(Boolean);
  const steps = [];
  for (const line of lines) {
    const m = line.match(/^\d+[.)]\s*(.+)$/);
    if (!m) continue;
    const body = m[1].replace(/^\[[ xX]\]\s*/, "").trim();
    if (body.length < 3) continue;
    if (/^(create|make|return|list|write|give).*(step|plan|ordered)/i.test(body)) continue;
    if (taskLc && body.toLowerCase().startsWith(taskLc.slice(0, 40))) continue;
    steps.push({ content: body, status: "pending", priority: "medium" });
    if (steps.length >= 8) break;
  }
  return steps;
}

module.exports = { KiloPlanner, localPlan, parsePlanFromText };

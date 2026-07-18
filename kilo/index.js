// kilo/index.js
// Feature: Kilo CLI | Trace: kilo/index.js
// Why: Entry point. Run `node kilo/index.js "<task>"` to let kilo plan, open an
// inner Playwright browser, stream live video, and auto-browse. Prints the
// live-video URL and step progress.
"use strict";

const { Kilo } = require("./core/kilo");

async function main() {
  const task = process.argv.slice(2).join(" ").trim();
  if (!task) {
    console.error("Usage: node kilo/index.js \"<task description>\"");
    process.exit(1);
  }

  const kilo = new Kilo({
    onStep: ({ index, step, total }) => {
      console.log(`\n[plan ${index + 1}/${total}] ${step.content}`);
    },
    onEvent: (e) => {
      if (e.type === "step-done") console.log(`  -> done: ${e.result}`);
      else if (e.type === "step-error") console.log(`  -> error: ${e.error}`);
      else if (e.type === "tool-result") console.log(`  [tool ${e.tool}]`);
      else if (e.type === "stream-error") console.log(`  [stream error] ${e.error}`);
    },
  });

  console.log("Kilo planning...");
  const out = await kilo.run(task);
  console.log(`\nKilo finished. Live video: ${out.videoUrl}`);
  console.log("Plan:");
  for (const s of out.plan) console.log(`  [${s.status}] ${s.content}`);
  await kilo.stop();
  process.exit(0);
}

main().catch((err) => {
  console.error("Kilo failed:", err);
  process.exit(1);
});

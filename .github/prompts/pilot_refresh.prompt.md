---
description: "Re-sync the AI with AIDDE core laws to prevent instruction drift. Run every 10 messages or when output quality degrades."
agent: "agent"
tools: ["read"]
---

# /pilot_refresh — Anti-Drift Re-Sync

Delegate to `context-manager` agent.

Re-read `.github/copilot-instructions.md` now.

Confirm adherence to each law:
- [ ] 100-Line Law — no file or function exceeds 100 lines
- [ ] Type Safety — no `any`, all values have explicit models
- [ ] Trace Headers — every generated file has the AIDDE trace block
- [ ] Feature Architecture — logic in `src/features/<feature>/`
- [ ] AIDDE Quad — Trace + Wire + Test + Verify before every commit
- [ ] Unit Tests — test file created AND executed for every source file
- [ ] CLI First — gh / gcloud / firebase only, no hardcoded credentials
- [ ] Hierarchy — every prompt maps to Milestone → Issue → Subtask

Respond with: **"Systems Online."** followed by the current session state summary.

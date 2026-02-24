---
description: A comprehensive workflow for planning, documenting, and structuring a GitHub Issue.
---

# GitHub Issue Planning Workflow

This workflow ensures every issue serves as a complete technical blueprint before any code is written, aligning with the "Predictive Logic" rule.

1. **Title & Tags**: Create a clear semantic title (e.g., `feat(auth): implement SSO`) and attach relevant labels (`enhancement`, `bug`, etc.).
2. **Problem Statement**: Explicitly state the "Why" (referencing the AI Constitution's Why Mandate). What business or technical requirement is this solving?
3. **Proposed Architecture**: 
   - Define which `src/features/<feature>/` this issue touches.
   - Outline the files that will be created (`.types.ts`, `.utils.ts`) to ensure adherence to the 100-Line Law.
4. **Root Cause Analysis (Bugs Only)**: If this is a bug, include the RCA from the `Mission: Medic` protocol. What was the *design flaw*, not just the syntax error?
5. **Acceptance Criteria**: Provide a checklist of conditions that must be met for this issue to be closed.
6. **Assign & Link**: Assign the issue to an owner and link it to the relevant Milestone.

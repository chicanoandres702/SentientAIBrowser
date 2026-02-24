---
description: An advanced strategy for structuring GitHub Milestones for predictable delivery.
---

# GitHub Milestone Strategy Workflow

This workflow uses "Predictive Logic" to organize issues into coherent, achievable milestones.

1. **Define the Milestone Goal**: Set a clear objective for the milestone (e.g., `v1.2: Payment Gateway Integration`).
2. **Scope the Work (Epics)**: Break the milestone down into major features (Epics).
3. **Issue Chunking**: Ensure every feature is broken down into small, modular issues that can be implemented in under 100 lines of code logic. If an issue sounds like it requires a massive file, break it down further.
4. **Determine Blockers**: Map out dependencies. Work on core interfaces (`.types.ts`) and pure functions (`.utils.ts`) must precede side-effect heavy services (`.service.ts`).
5. **Review AI Context Density**: Ensure that no single milestone requires touching the entire repository at once, which prevents AI Context Poisoning. Restrict milestones to specific `src/features/` quadrants where possible.

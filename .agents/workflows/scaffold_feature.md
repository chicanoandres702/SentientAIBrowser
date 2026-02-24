---
description: Automatically scaffold a new feature strictly adhering to the AI Constitution's Feature Architecture rule.
---

# Scaffold Feature Workflow

This workflow sets up the skeleton for a new feature located in `src/features/<feature>/` perfectly aligned with the "Modular First" architecture.

1. Ensure the directory `src/features/` exists.
2. Create `src/features/<feature_name>/`
3. Inside that folder, create the core AI Constitution compliant files:
   - `[feature_name].types.ts` (For all interfaces and shared types).
   - `[feature_name].utils.ts` (For pure, stateless logic).
   - `[feature_name].service.ts` (For API/DB integrations).
   - `[feature_name].component.tsx` (or equivalent orchestrator/UI).
4. Verify none of the generated template files exceed the 100-line law limit.

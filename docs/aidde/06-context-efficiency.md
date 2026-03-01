# Component: AI Context Efficiency

AI intelligence is inversely proportional to context noise.
Keep the token window clean, dense, and relevant.

## The Golden Rule: Locality of Reference
Everything the AI needs to understand a piece of code must be
right next to it, or explicitly passed into it.

## Highly Efficient Paradigms (Use These)

### Functional Core / Pure Functions
High efficiency. No global state needed to test or write logic.
The AI sees: input → output. Nothing hidden.

### Explicit Data Models
Types act as highly compressed blueprints.
One interface = full data shape understood immediately.
Prefer Models over dynamic Factories.

### Vertical Slicing
Group files by Feature, not by Type.
When fixing a feature, the AI only loads that specific directory.
```
src/features/
  user-auth/          ← Load only this to work on auth
    user-auth.types.ts
    user-auth.service.ts
    user-auth.controller.ts
    user-auth.service.test.ts
```

## Context Killers (Avoid These)

### Deep OOP Inheritance
The AI must load multiple ancestor files to understand one method.
Use Composition instead of Inheritance.

### Magic Frameworks & Implicit State
Auto-wiring and heavy reflection hide the wires.
The AI cannot trace what it cannot explicitly read.

### The God File
Files over 100 lines destroy focus and cause hallucinations.
Files over 300 lines are a security risk.
The 100-Line Law is non-negotiable.

## Context Budget Rules
- Max **5 files** loaded per task execution
- If more are needed, the feature slice must be split (vertical slice violation)
- Unused tabs (15+ min) should be closed to prevent Context Poisoning
- Keep neighbor files open: logic file + its interface/types

## Anti-Drift Protocol
AI instruction drift occurs every 10-15 messages.
Run `/pilot_refresh` to re-sync. Delegate to `context-manager` agent.

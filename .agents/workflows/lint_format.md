---
description: Automatically run linting and fix format issues matching the language-specific standards.
---

# Lint & Format Workflow

This workflow enforces "Clean Code" directives and specifically applies Language-Specific Standards (Functional JS, PEP8, SOLID C#) automatically.

// turbo-all
1. Run standard linter for the active project (e.g., `npm run lint:fix`, `flake8`, `dotnet format`).
2. Run standard formatter (e.g., `prettier --write .`, `black .`).
3. If Type errors exist, run type checking (e.g., `tsc --noEmit`, `mypy`).
4. Review the Problems tab and perform Root Cause Analysis on any remaining errors before attempting manual AI fixes.

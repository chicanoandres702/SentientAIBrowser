---
description: Automatically generates strict configuration files for maintaining clean code.
---

# Setup Linter Config Workflow

This workflow initializes the strict formatting and linting rules mandated by the AI Constitution into physical configuration files.

1. Create a root `.editorconfig` to enforce tab sizing, line endings, and trailing whitespace across all IDEs natively.
2. Dependent on the active language (e.g., TS/JS), initialize `.eslintrc.json`, `prettier.config.js`, or similar tools.
3. Force rules like `no-console` (warn), strict typing (`no-explicit-any`), and line-length constraints directly into the generated config.

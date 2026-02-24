---
description: Generates a comprehensive `.aiignore` (and `.cursorignore`) to block context poisoning and preserve AI Token Density.
---

# Scaffold AI Ignore Workflow

This workflow addresses the "Token Economy & Performance" section of the AI Constitution. If an AI reads compiled assets, heavy dependencies, or massive JSON files, its context is ruined.

1. Ensure `.aiignore` exists in the project root.
2. In the `.aiignore` file, block paths that generally lead to AI Context Poisoning:
   - `node_modules/` or `.venv/`
   - `dist/`, `build/`, `bin/`, `obj/`
   - `package-lock.json` or `poetry.lock` (AI doesn't need to read massive exact versions for general logic)
   - `*.log`, `*.sql` dumps
   - `coverage/` directories
3. Copy the contents of `.aiignore` to `.cursorignore` to ensure compatibility across Cursor or Windsurf.
4. If there's a `.gitignore` present, ensure the AI ignores are at minimum matching the git ignores.

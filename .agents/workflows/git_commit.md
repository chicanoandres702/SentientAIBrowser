---
description: An efficient workflow for staging, committing, and pushing code according to clean code standards.
---

# Efficient GitHub Commit Workflow

This workflow ensures all code is committed cleanly with semantic commit messages.

// turbo-all
1. `git add .` - Stage all modified files.
2. Check `git status` to ensure you aren't committing unnecessary files (e.g., `.env`, massive binaries).
3. If clean, generate a semantic commit message (e.g., `feat: login flow`, `fix: header padding`, `refactor: component logic`).
4. `git commit -m "<semantic_message>"`
5. `git push origin <current_branch>`

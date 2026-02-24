---
description: Automatically set up Git Hooks to enforce the AI Constitution before any local commit.
---

# Git Hooks Setup Workflow

This workflow implements local hooks (via `husky` or native `.git/hooks`) to prevent non-compliant code from being committed.

// turbo-all
1. Verify if `husky` is installed in the target project. If not, suggest running `npm install husky --save-dev` and `npx husky install`.
2. Implement a `pre-commit` hook that automatically runs the `lint_format` workflow (e.g., `npx lint-staged` or `npm run lint:fix`).
3. Implement a custom script in the hook to verify the **100-Line Law**. (e.g., an automated check that fails the commit if any newly staged `.ts`, `.py`, or `.cs` file exceeds 100 lines).
4. Implement a `commit-msg` hook (e.g., via `commitlint`) to guarantee semantic commit messages match the `git_commit` workflow.

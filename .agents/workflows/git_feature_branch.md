---
description: Automatically establish a new feature branch mapped to an active Issue or Milestone before coding.
---

# Feature Branching Workflow

This workflow addresses the "Branch per feature" Git strategy. No work should ever be committed directly to `main` outside of the initial repository scaffold or emergency `git_hotfix`.

// turbo-all
1. Ensure your local `main` is up to date: `git checkout main` and `git pull origin main`.
2. Determine the active Issue or Feature you are working on (e.g., Issue #12: "Implement Edge Login").
3. Create and immediately switch to a semantic feature branch:
   - `git checkout -b feature/auth-edge-login` (for new features)
   - `git checkout -b fix/captcha-timeout` (for bug fixes)
   - `git checkout -b refactor/orchestrator-cleanup` (for 100-line law refactoring)
4. Push the branch to the remote so it can be tracked immediately:
   - `git push -u origin <branch-name>`
5. Proceed to write your code in `src/features/<feature>/`.
6. Once completed, follow the `git_commit` and `git_pr` workflows to merge back to `main`.

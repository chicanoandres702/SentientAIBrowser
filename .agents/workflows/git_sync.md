---
description: An efficient workflow for fetching, rebasing, and syncing the local branch with remote main.
---

# Efficient GitHub Sync Workflow

This workflow ensures your local branch stays up to date with `main` without creating messy merge commits.

// turbo-all
1. `git fetch origin` - Get latest changes from remote.
2. `git rebase origin/main` - Replay your local changes on top of the latest main.
3. If there are conflicts, stop and resolve them in the IDE.
4. After resolving conflicts: `git add .` and `git rebase --continue`.
5. Once rebase is successful, `git push origin <current_branch> --force-with-lease` to update the remote safely.

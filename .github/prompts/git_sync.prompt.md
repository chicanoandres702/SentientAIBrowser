---
description: "Fetch, rebase, and sync the current local branch with remote main. Safe sync using rebase to maintain linear history."
agent: "agent"
tools: ["execute"]
---

# /git_sync — Branch Sync Workflow

```bash
CURRENT=$(git branch --show-current)
echo "Syncing $CURRENT with remote..."

# Fetch all remotes
git fetch --all --prune

# Rebase current branch onto latest main
git rebase origin/main

# Push (force-with-lease is safe — only fails if someone else pushed)
git push --force-with-lease origin $CURRENT

echo "✅ $CURRENT synced with origin/main"
```

If rebase has conflicts: STOP. Do not auto-resolve.
Report the conflicting files and ask the user for resolution strategy.

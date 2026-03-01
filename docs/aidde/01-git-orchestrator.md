# Component: Git Orchestrator

Governs project management, branch hierarchy, and Git state.
Orphaned issues or branches are strictly forbidden.

## Hierarchy

| Level | Entity | Branch | Rule |
|-------|--------|--------|------|
| Feature | Milestone | `feature/{milestone-slug}` | Integration branch |
| Task | Issue | `feature/{milestone-slug}/{task-slug}` | Execution branch |
| Subtask | Checklist item | None | Atomic commit only |

## API Auto-Provisioning (via gh CLI)

**Always GET before POST. Never create duplicates.**

```bash
# 1. Check/create Milestone (Feature)
gh api repos/{owner}/{repo}/milestones \
  --jq ".[] | select(.title==\"{name}\") | .number"

gh api repos/{owner}/{repo}/milestones \
  -f title="{name}" -f description="{desc}"

# 2. Create integration branch
git checkout -b feature/{milestone-slug}
git push -u origin feature/{milestone-slug}

# 3. Check/create Issue (Task)
gh issue list --milestone "{name}" --search "{title}"
gh issue create --title "{title}" \
  --milestone "{name}" --label "{type}" --assignee "{user}" \
  --body "{aidde-template}"

# 4. Create execution branch
git checkout feature/{milestone-slug}
git checkout -b feature/{milestone-slug}/{task-slug}
git push -u origin feature/{milestone-slug}/{task-slug}
```

## Context Switching (Stash & Switch)

```bash
# Save current work
git stash push -m "context-switch-$(date +%s)"

# Move to target (hotfix, etc.)
git checkout {target-branch}
# ... apply fix, commit ...

# Restore
git checkout {original-branch}
git stash pop
```

## Stale Branch Policy
Branches with no commits in 14+ days are flagged during Boot Sync.
Ask user: continue | close | reassign — never auto-delete.

---
description: "Emergency hotfix workflow for production-breaking bugs. Stashes current work, creates hotfix branch from main, applies fix, runs all 8 gates, then restores original branch."
argument-hint: "Brief description of the production bug"
agent: "agent"
tools: ["execute", "read", "edit"]
---

# /git_hotfix — Emergency Patch Workflow

## Step 1: Save Current State
```bash
ORIGINAL_BRANCH=$(git branch --show-current)
echo "Saving work on: $ORIGINAL_BRANCH"
git stash push -m "hotfix-stash-$(date +%s)"
```

## Step 2: Create Hotfix Branch
```bash
git checkout main && git pull origin main
git checkout -b hotfix/{issue-slug}
```

## Step 3: Create Hotfix Issue
```bash
ISSUE_NUM=$(gh issue create \
  --title "[HOTFIX] {bug description}" \
  --label "bug,medic" \
  --assignee "@me" \
  --body "### 🎯 Purpose
Emergency production fix.

### 🐛 The Issue
{error description}

### ☑️ Subtasks
- [ ] Identify root cause (3x Why)
- [ ] Apply minimal fix
- [ ] Run all 8 CI/CD gates
- [ ] Merge to main" \
  --json number --jq '.number')
echo "Hotfix Issue #$ISSUE_NUM created"
```

## Step 4: Apply Fix
Delegate to `medic-debug` agent for RCA before writing any code.

## Step 5: Commit and PR
```bash
git add -p
git commit -m "fix: {fix description}

Emergency hotfix — production critical.

Resolves: #$ISSUE_NUM
Parent Feature (Milestone): Hotfix"

git push -u origin hotfix/{issue-slug}

gh pr create \
  --title "[HOTFIX] {fix description}" \
  --base main \
  --head hotfix/{issue-slug}
```

## Step 6: Restore Original Work
```bash
git checkout $ORIGINAL_BRANCH
git stash pop
echo "Restored to $ORIGINAL_BRANCH"
```

Confirm: hotfix PR URL, original branch restored, stash cleared.

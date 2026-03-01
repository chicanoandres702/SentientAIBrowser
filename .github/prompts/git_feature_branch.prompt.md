---
description: "Create a new Feature Milestone and Task Issue with execution branch. Provisions the full AIDDE hierarchy: milestone → issue → branch via gh CLI."
argument-hint: "Feature name and task description"
agent: "agent"
tools: ["execute", "read"]
---

# /git_feature_branch — Provision AIDDE Hierarchy

Delegate to `git-orchestrator` agent for all gh CLI operations.
Ask for feature name and task description if not provided.

## Step 1: Check/Create Milestone (Feature)
```bash
MILESTONE_NUM=$(gh api repos/{owner}/{repo}/milestones \
  --jq ".[] | select(.title==\"{feature-name}\") | .number")

if [ -z "$MILESTONE_NUM" ]; then
  MILESTONE_NUM=$(gh api repos/{owner}/{repo}/milestones \
    -f title="{feature-name}" \
    -f description="{feature-description}" \
    --jq '.number')
  echo "Created Milestone #$MILESTONE_NUM"
else
  echo "Reusing existing Milestone #$MILESTONE_NUM"
fi

# Create integration branch
git checkout main && git pull
git checkout -b feature/{milestone-slug}
git push -u origin feature/{milestone-slug}
```

## Step 2: Create Issue (Task)
```bash
ISSUE_NUM=$(gh issue create \
  --title "{task-title}" \
  --body "{aidde-issue-template}" \
  --milestone "{feature-name}" \
  --label "task,feature" \
  --assignee "@me" \
  --json number --jq '.number')
echo "Created Issue #$ISSUE_NUM"
```

## Step 3: Create Execution Branch
```bash
git checkout feature/{milestone-slug}
git checkout -b feature/{milestone-slug}/{task-slug}
git push -u origin feature/{milestone-slug}/{task-slug}
```

## Step 4: Link Branch to Issue
```bash
gh issue develop $ISSUE_NUM \
  --name "feature/{milestone-slug}/{task-slug}" \
  --base "feature/{milestone-slug}"
```

Confirm: Milestone #, Issue #, branches created, and execution branch checked out.

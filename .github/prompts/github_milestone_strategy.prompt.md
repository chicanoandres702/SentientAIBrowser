---
description: "Plan and create a GitHub Milestone (Feature) with structured delivery goals, labels, and due date."
argument-hint: "Feature/milestone name and description"
agent: "agent"
tools: ["execute", "read"]
---

# /github_milestone_strategy — Feature Milestone Planning

Delegate to `git-orchestrator` agent.

Ask for:
- Feature name
- Feature description (what user value does this deliver?)
- Due date (optional, YYYY-MM-DD)

## Check for existing milestone first
```bash
gh api repos/{owner}/{repo}/milestones \
  --jq ".[] | select(.title==\"{feature-name}\") | .number"
```

## Create Milestone if absent
```bash
gh api repos/{owner}/{repo}/milestones \
  -f title="{feature-name}" \
  -f description="{feature-description}" \
  -f due_on="{due-date}T23:59:59Z" \
  --jq '.number'
```

## Create integration branch
```bash
git checkout main && git pull
git checkout -b feature/{milestone-slug}
git push -u origin feature/{milestone-slug}
```

Confirm: Milestone number, integration branch created, due date set.

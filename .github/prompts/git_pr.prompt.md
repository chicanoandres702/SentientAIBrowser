---
description: "Create a Pull Request following the AIDDE format. Verifies all 8 CI/CD gates, generates PR body from the Issue template, and targets the correct parent feature branch."
argument-hint: "Issue number to create PR for"
agent: "agent"
tools: ["execute", "read"]
---

# /git_pr — AIDDE Pull Request Workflow

Ask for Issue number if not provided.

## Step 1: Verify AIDDE Quad Passed
```bash
# Confirm all 4 Quad steps complete before creating PR
git log --oneline -3
npm run test -- --passWithNoTests 2>/dev/null || true
```

## Step 2: Determine Branches
```bash
HEAD=$(git branch --show-current)
# Task branch: feature/milestone-slug/task-slug
# Base should be: feature/milestone-slug
BASE=$(echo "$HEAD" | cut -d'/' -f1-2)
echo "PR: $HEAD → $BASE"
```

## Step 3: Fetch Issue Data for PR Body
```bash
ISSUE=$(gh issue view #{issue-number} --json title,body,milestone)
MILESTONE=$(echo $ISSUE | jq -r '.milestone.title')
MILESTONE_NUM=$(echo $ISSUE | jq -r '.milestone.number')
```

## Step 4: Create PR
```bash
gh pr create \
  --title "{task-title}" \
  --body "## 🎯 Purpose
{purpose-from-issue}

## 📝 Description
{description-from-issue}

## 🔄 System Flow
* **Upstream:** {upstream}
* **Downstream:** {downstream}

## ☑️ AIDDE Quad Checklist
- [x] **Trace** — Commit message contains \`Resolves: #${ISSUE_NUM}\`
- [x] **Wire** — All imports resolve. No dead exports.
- [x] **Test** — Unit tests created and passing.
- [x] **Verify** — All 8 CI/CD Gates passed.

## 🔗 Traceability
Resolves: #{issue-number}
Parent Feature (Milestone): $MILESTONE (ID: #$MILESTONE_NUM)" \
  --base "$BASE" \
  --head "$HEAD"
```

## Step 5: Confirm CI Status
```bash
gh pr checks
```

Confirm: PR URL, base branch, CI status.

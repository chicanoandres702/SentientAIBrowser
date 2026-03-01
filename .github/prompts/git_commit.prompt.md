---
description: "Stage, commit, and push code following the AIDDE commit format. Enforces Resolves #IssueID, subtask progress, and AIDDE Quad confirmation in every commit message."
argument-hint: "Issue number, subtask description, subtask progress (e.g. 2 of 3)"
agent: "agent"
tools: ["execute", "read"]
---

# /git_commit — AIDDE Commit Workflow

Ask for: Issue number, subtask description, subtask N of Total if not provided.

## Step 1: Pre-Commit Checks
```bash
# Ensure on the correct execution branch
git branch --show-current
git status

# Run AIDDE Quad before committing
# Delegate: type-enforcer → test-validator → complexity-guard → security-auditor
```

## Step 2: Stage Changes
```bash
git add -p   # Interactive staging — review every hunk
```

## Step 3: Commit with AIDDE Format
```bash
git commit -m "feat: {subtask description}

- Subtask {n} of {total} complete
- Passes all unit tests (AIDDE Quad)

Resolves: #{issue-number}
Parent Feature (Milestone): {milestone-name} (ID: #{milestone-number})"
```

## Step 4: Push
```bash
git push origin $(git branch --show-current)
```

## Step 5: Update Issue Checklist
```bash
# Mark subtask as complete in Issue body via gh CLI
gh issue view #{issue-number} --json body
# Update the checklist item: - [ ] → - [x]
gh issue edit #{issue-number} --body "{updated-body}"
```

Confirm: commit SHA, branch pushed, and Issue checklist updated.

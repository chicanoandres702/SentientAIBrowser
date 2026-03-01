---
description: "Plan and create a GitHub Issue (Task) with the full AIDDE body template. Enforces purpose, system flow, traceability, and subtask checklist."
argument-hint: "Task description and parent feature/milestone name"
agent: "agent"
tools: ["execute", "read"]
---

# /github_issue_planning — Task Issue Planning

Delegate to `git-orchestrator` agent.

Ask for these if not provided:
- Task title
- Parent Milestone (Feature) name
- Upstream system (where data comes from)
- Downstream system (what it affects)
- Subtasks (at least 2)

## Create the Issue
```bash
gh issue create \
  --title "{task-title}" \
  --milestone "{feature-name}" \
  --label "task" \
  --assignee "@me" \
  --body "### 🎯 Purpose
{purpose}

### 📝 Description
{description}

### 🔄 System Flow (Traceability)
* **Upstream:** {upstream}
* **Downstream:** {downstream}

### ☑️ Subtasks (Execution Checklist)
- [ ] {subtask-1}
- [ ] {subtask-2}

### 🚀 Future Aspirations & Tracing
{future-notes}"
```

Confirm: Issue number, milestone linked, labels set, assignee set.

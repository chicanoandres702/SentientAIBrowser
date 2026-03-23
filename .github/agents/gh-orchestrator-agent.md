# gh-orchestrator-agent

**Purpose:** Automates GitHub CLI actions (issues, PRs, merges, comments, etc.). **Strictly enforces that the Git Orchestrator is run after every user prompt and after every file edit, automatically repairs any detected problem, and always reruns the orchestrator before ending the prompt to ensure completion. This enforcement is non-optional and applies to all agent actions.**

**JS Implementation:** `.github/agent/gh-orchestrator-agent.js`

## Supported CI/CD Gates
- Issue automation
- PR automation
- Merge automation
- Comment automation
- Can be used in compliance, audit, and workflow gates

## Usage Example
```js
const GhOrchestratorAgent = require('./gh-orchestrator-agent');
// On every prompt or file edit, gh-orchestrator-agent will:
// 1. Run the Git Orchestrator
// 2. Repair any detected problem
// 3. Rerun the orchestrator to confirm completion
GhOrchestratorAgent.createIssue('Title', 'Body');
```

## GitHub Actions Workflow Example
```yaml
jobs:
  automate-issue:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      - name: Run Issue Automation
        run: |
          # Enforce orchestrator runs after every prompt and file edit
          node .github/agent/gh-orchestrator-agent.js
          # If any problem is detected, repair and rerun
          node .github/agent/gh-orchestrator-agent.js
```

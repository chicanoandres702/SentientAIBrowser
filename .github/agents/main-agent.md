# main-agent

**Purpose:** Orchestrates all subagents in a chain-style automation for end-to-end CI/CD gate enforcement and project orchestration. **Strictly enforces that the Git Orchestrator is run after every user prompt and after every file edit, automatically repairs any detected problem, and always reruns the orchestrator before ending the prompt to ensure completion. This enforcement is non-optional and applies to all agent actions.**

**JS Implementation:** `.github/agent/main-agent.js`

## Supported CI/CD Gates
- Project structure and compliance (software-architect-agent)
- Refactor and code quality (refactor-agent)
- Test validation and coverage (test-validator-agent)
- AI code generation and Q&A (gemini-agent)
- GitHub CLI automation (gh-orchestrator-agent)
- GitHub API automation (github-agent)
- Audit logging (audit-agent)

## How It Works
- Runs as the entry point for all automation.
- **On every user prompt and after every file edit:**
  - Runs the Git Orchestrator to validate branch hierarchy, issue mapping, and compliance.
  - If any problem is detected (e.g., orphaned branch, missing issue, stale branch, CI/CD gate failure), the agent automatically attempts to repair it (e.g., create missing issue, re-link branch, refactor code, rerun tests).
  - After any repair or change, reruns the orchestrator script to verify that all gates and hierarchy are now passing.
  - This enforcement is strict and non-optional: the orchestrator is always run after every prompt and file edit, and before ending any agent session.
- Delegates each CI/CD gate and workflow step to the appropriate subagent.
- Logs and audits every action for compliance and traceability.
- Handles errors gracefully and reports failures, but always attempts automated repair before reporting failure.

## Usage Example
```js
// Run the orchestrator to trigger all gates and automation
// On every prompt or file edit, main-agent will:
// 1. Run the Git Orchestrator
// 2. Repair any detected problem
// 3. Rerun the orchestrator to confirm completion
node .github/agent/main-agent.js
```

## GitHub Actions Workflow Example
```yaml
jobs:
  full-orchestration:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      - name: Run Main Orchestrator Agent
        run: node .github/agent/main-agent.js
```

# main-agent

**Purpose:** Orchestrates all subagents in a chain-style automation for end-to-end CI/CD gate enforcement and project orchestration.

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
- Delegates each CI/CD gate and workflow step to the appropriate subagent.
- Logs and audits every action for compliance and traceability.
- Handles errors gracefully and reports failures.

## Usage Example
```js
// Run the orchestrator to trigger all gates and automation
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

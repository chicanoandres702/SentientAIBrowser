# github-agent

**Purpose:** Direct GitHub API automation (REST API calls and CLI commands).

**JS Implementation:** `.github/agent/github-agent.js`

## Supported CI/CD Gates
- Repo info automation
- API-driven compliance
- Can be used in integration, compliance, and audit gates

## Usage Example
```js
const GitHubAgent = require('./github-agent');
GitHubAgent.getRepoInfo('owner', 'repo');
```

## GitHub Actions Workflow Example
```yaml
jobs:
  github-api:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      - name: Run GitHub Agent
        run: node .github/agent/github-agent.js
```

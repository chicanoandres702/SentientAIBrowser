# refactor-agent

**Purpose:** Suggests modularization and refactoring.

**JS Implementation:** `.github/agent/refactor-agent.js`

## Supported CI/CD Gates
- Refactor suggestions
- Code quality improvement
- Can be used in maintainability and code review gates

## Usage Example
```js
const RefactorAgent = require('./refactor-agent');
RefactorAgent.suggestRefactor('moduleName');
```

## GitHub Actions Workflow Example
```yaml
jobs:
  refactor-check:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      - name: Run Refactor Agent
        run: node .github/agent/refactor-agent.js
```

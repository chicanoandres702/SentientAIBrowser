---
description: An emergency patch workflow for production-breaking bugs that bypasses standard milestones.
---

# Git Hotfix Workflow

This workflow is for critical issues requiring immediate resolution outside of the regular `github_milestone_strategy`.

// turbo-all
1. From `main`, run `git checkout -b hotfix/<issue-name>`.
2. Execute the `Mission: Medic` protocol locally: diagnose the root design flaw causing the system panic.
3. Implement the patch (abiding strictly by the 100-Line Law). Ensure `lint_format` and `run_tests` workflows are passed successfully.
4. Stage changes: `git add .`
5. Commit using the hotfix prefix: `git commit -m "fix(hotfix): <clear semantic message>"`
6. `git push -u origin hotfix/<issue-name>`
7. Generate the Pull Request details pointing immediately towards the main production-bound branch.

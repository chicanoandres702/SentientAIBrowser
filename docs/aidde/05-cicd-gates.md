# Component: CI/CD Gates (The "Do It" Check)

A PR fails ANY gate = instant rejection. No exceptions.

## The 8 Gates

### Gate 1: Orchestration Gate
PR body MUST contain `Resolves #IssueID`.
No issue link = no merge.

### Gate 2: Parent Hierarchy Gate
- Issue MUST be assigned to a Milestone via API
- Task branch `feature/slug/task` MUST merge into `feature/slug`
- Wrong base branch = rejected

### Gate 3: Template Gate
Issue body MUST contain all required sections:
`🎯 Purpose` · `🔄 System Flow` · `☑️ Subtasks`
Issue MUST have: Assignees + Labels

### Gate 4: Static Analysis Gate (Type Check)
Zero warnings/errors from the native strict analyzer:
- TypeScript: `tsc --noEmit --strict`
- Python: `mypy . --strict`
- Go: `go vet ./...`
- Rust: `cargo clippy -- -D warnings`

### Gate 5: Wiring Gate
No dangling imports, unused variables, or orphaned functions.
Run: `npm run lint` / `flake8` / `golangci-lint`

### Gate 6: Test Gate
Unit tests created AND passing for every modified file.
Coverage ≥ 80% for changed files.

### Gate 7: Complexity Gate (100-Line Law)
Any file modified in the PR exceeding 100 active lines = rejected.
Refactor before re-submitting.

### Gate 8: Security Architect Scan (Zero Trust)
- `npm audit --audit-level=high`
- No hardcoded secrets (regex scan on diff)
- OWASP Top 10 patterns checked
- Dependency vulnerabilities = rejection

## Rollback Protocol
If any gate fails after a commit:
1. Do NOT amend or force-push
2. Open a new Subtask: `fix: resolve <Gate N> failure`
3. Re-run full AIDDE Quad before re-submitting

## Gate Workflow File
`.github/workflows/do-it-check.yml`

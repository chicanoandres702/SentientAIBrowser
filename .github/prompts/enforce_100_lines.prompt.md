---
description: "Scan all source files for 100-Line Law violations and refactor into modular components. Splits files exceeding 100 lines into controller, service, types, and utils."
agent: "agent"
tools: ["execute", "read", "edit", "search"]
---

# /enforce_100_lines — 100-Line Law Enforcement

Delegate detection to `complexity-guard` agent, then apply refactors here.

## Exemptions
Never scan these paths — they are config/instruction files, not source code:
`.github/agents/`, `.github/prompts/`, `.github/workflows/`, `.github/copilot-instructions.md`,
`docs/aidde/`, `prompts/`, `README.md`

## Step 1: Scan
```bash
# Source code only — excludes .github/ and docs/
find src lib functions -name "*.ts" -o -name "*.py" -o -name "*.go" 2>/dev/null | \
  xargs wc -l | sort -rn | awk '$1 > 100 && $2 != "total"'
```

## Step 2: For each violating file
1. Analyze responsibilities (what does this file do?)
2. Propose split: controller / service / types / utils
3. Show estimated line counts per new file
4. Confirm with user before refactoring

## Step 3: Refactor
- Extract interfaces → `{name}.types.ts`
- Extract pure logic → `{name}.service.ts`
- Keep orchestration → `{name}.controller.ts`
- Extract helpers → `{name}.utils.ts`
- Update all import paths across the codebase

## Step 4: Validate
- Delegate to `test-validator`: run all affected tests
- Delegate to `type-enforcer`: confirm no type regressions
- Re-run complexity scan: confirm zero violations

Report: files refactored, before/after line counts, test results.

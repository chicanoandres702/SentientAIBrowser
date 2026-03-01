---
description: "Scaffold a full AIDDE feature slice. Creates the directory structure, controller, service, types, utils files, and test files for a new feature following Feature Architecture."
argument-hint: "Feature name (e.g. user-auth, payment, notifications)"
agent: "agent"
tools: ["execute", "edit", "read", "search"]
---

# /scaffold_feature — Feature Slice Generator

Ask for feature name if not provided. Derive `{feature}` as kebab-case.

## Step 1: Create Directory Structure
```bash
FEATURE="{feature-name}"
mkdir -p src/features/$FEATURE
```

## Step 2: Generate Files with Trace Headers
Create these files (each ≤ 100 lines):

### `src/features/{feature}/{feature}.types.ts`
```typescript
/*
 * [Parent Feature/Milestone] {Feature Name}
 * [Child Task/Issue] #TBD
 * [Subtask] Define type contracts for {feature}
 * [Upstream] External input -> [Downstream] {feature}.service.ts
 * [Law Check] <lines> lines | Passed Do It Check
 */

// All interfaces for this feature go here
// No logic — types only
export interface {Feature}Input {
  // define fields
}

export interface {Feature}Output {
  // define fields
}

export interface {Feature}Error {
  code: string;
  message: string;
}
```

### `src/features/{feature}/{feature}.service.ts`
```typescript
/*
 * [Parent Feature/Milestone] {Feature Name}
 * [Child Task/Issue] #TBD
 * [Subtask] Business logic for {feature}
 * [Upstream] {feature}.controller.ts -> [Downstream] Repository/API
 * [Law Check] <lines> lines | Passed Do It Check
 */

import type { {Feature}Input, {Feature}Output } from './{feature}.types';

// Pure functions only — no side effects, no global state
export const process{Feature} = (input: {Feature}Input): {Feature}Output => {
  // business logic here
};
```

### `src/features/{feature}/{feature}.controller.ts`
```typescript
/*
 * [Parent Feature/Milestone] {Feature Name}
 * [Child Task/Issue] #TBD
 * [Subtask] Orchestration for {feature}
 * [Upstream] Router -> [Downstream] {feature}.service.ts
 * [Law Check] <lines> lines | Passed Do It Check
 */

import { process{Feature} } from './{feature}.service';
import type { {Feature}Input } from './{feature}.types';

// Orchestration only — no business logic here
export const handle{Feature} = async (input: {Feature}Input) => {
  return process{Feature}(input);
};
```

## Step 3: Delegate to test-validator
Create and run `src/features/{feature}/{feature}.service.test.ts`

## Step 4: Register in module manager
```bash
echo "// {Feature} registered" >> src/features/index.ts
```

Confirm: all files created, tests passing, 100-Line Law satisfied.

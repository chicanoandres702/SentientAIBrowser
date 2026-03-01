# Modular Refactoring Guide

## Completed ✅

### Feature Modules Created
- `src/features/workflow/` — Tab/workflow management (Types + Utils + Service)
- `src/features/tasks/` — Mission task execution (Types + Utils + Service)

## Next Steps (Priority Order)

### 1. Update Components to Use Features

**File: `src/components/WorkflowPanel.tsx`**
```typescript
// Before
import { TaskItem } from '../features/tasks/types';
import { useActiveMission } from './tasks/task-filter.utils';
import { getCurrentTaskForMission } from '../services/mission-task.utils';

// After
import { TaskItem, getCurrentTaskForMission, filterTasks } from '../features/tasks';
```

**File: `src/components/WorkflowSelector.tsx`**
```typescript
// Before
import { selectTab, addNewTab } from '../hooks/useBrowserTabs';

// After
import { selectTab, addNewTab, TabItem } from '../features/workflow';
```

### 2. Consolidate Hooks

**Create: `src/hooks/useWorkflow.ts`**
```typescript
import { useCallback, useReducer } from 'react';
import { selectTab, addNewTab, closeTab, TabItem, WorkflowState } from '../features/workflow';
import { syncNewTab, syncCloseTab } from '../features/workflow';

export const useWorkflow = (userId: string) => {
    const [workflow, dispatch] = useReducer(workflowReducer, initialState);

    const select = useCallback((tabId: string) => {
        const tabs = selectTab(workflow.tabs, tabId);
        dispatch({ type: 'SET_TABS', tabs });
        syncSelectTab(userId, tabs);
    }, [workflow.tabs, userId]);

    return { workflow, selectTab: select, addTab, closeTab };
};
```

### 3. Create Orchestration Layer

**File: `src/hooks/useBrowserState.ts`**
```typescript
// Combines workflow + tasks + execution
import { useWorkflow } from './useWorkflow';
import { useTasks } from './useTasks';

export const useBrowserState = (userId: string) => {
    const workflow = useWorkflow(userId);
    const tasks = useTasks(workflow.workflow.activeTabId);
    const execution = useExecution(tasks);

    return {
        workflow,
        tasks,
        execution,
        activeTabId: workflow.workflow.activeTabId,
    };
};
```

### 4. Remove Old Code

Delete:
- `src/services/browser-sync-service.ts` → now in `features/workflow`
- `src/services/mission-task-executor.ts` → migrate logic to features
- `src/utils/browser-utils.ts` → now in `features/workflow/workflow.utils.ts`
- `src/components/tasks/task-filter.utils.ts` → now in `features/tasks`

## Key Principles

1. **Types first** — All interfaces in `.types.ts`
2. **Pure functions second** — No imports except types in `.utils.ts`
3. **Services last** — Side effects in `.service.ts`
4. **Barrel exports** — `index.ts` controls public API
5. **One-liner imports** — `import { X, Y } from '../features/workflow'`

## Testing Benefits

### Before (Hard to test)
```typescript
// useBrowserTabs.ts
// - 123 lines
// - Direct Firestore imports
// - Complex state management
// - Hard to test without Firebase
```

### After (Easy to test)
```typescript
// features/workflow/workflow.utils.ts
// - Pure functions
// - No imports except types
// - No Firestore calls
// - Test independently

test('selectTab should set isActive to true', () => {
    const tabs = [{ id: '1', isActive: false, ... }];
    const result = selectTab(tabs, '1');
    expect(result[0].isActive).toBe(true);
});
```

## Performance Benefits

1. **Smaller bundle** — Tree-shake unused features
2. **Lazy loading** — Load feature modules on demand
3. **Faster hot-reload** — Change in `.utils.ts` → only components rebuild
4. **Better caching** — Stable feature APIs don't change

## Example Migration Path

### Step 1: Create feature module ✅ (DONE)
```bash
mkdir -p src/features/workflow
touch src/features/workflow/{workflow.types.ts,workflow.utils.ts,workflow.service.ts,index.ts}
```

### Step 2: Update one component
```bash
# Update WorkflowSelector.tsx to use features/workflow
# Deploy & test
```

### Step 3: Update remaining components
```bash
# Update WorkflowPanel.tsx, BrowserTabs.tsx, etc.
# One at a time to prevent breaking changes
```

### Step 4: Consolidate hooks
```bash
# Create useWorkflow.ts that orchestrates workflow feature
# Create useTasks.ts that orchestrates tasks feature
```

### Step 5: Delete old code
```bash
# Delete src/services/browser-sync-service.ts
# Delete src/utils/browser-utils.ts
# Delete duplicate code
```

## Metrics to Track

- Lines of code per module
- Import depth (max 3 levels)
- Cyclic dependency count (should be 0)
- Test coverage (aim for >80%)
- Bundle size (compare before/after)

## Deployment Strategy

1. Deploy feature modules (no breaking changes)
2. Deploy component updates one-by-one
3. Keep old code running (feature flags if needed)
4. Deprecation period: 2 weeks
5. Remove old code in next release

This ensures zero-downtime refactoring!

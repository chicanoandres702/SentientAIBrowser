# Quick-Start: Apply Modular Refactoring

## What You Have
✅ Core feature modules created
✅ Modular architecture documented
✅ Refactoring guide provided

## What You Need to Do (Next 30 mins)

### Step 1: Update WorkflowPanel (5 mins)

**File:** `src/components/WorkflowPanel.tsx`

```typescript
// OLD
import { useActiveMission, useFilteredTasks } from './tasks/task-filter.utils';
import { MissionTask, getCurrentTaskForMission } from '../services/mission-task.utils';

// NEW
import { TaskItem, getCurrentTaskForMission, filterTasks } from '../features/tasks';

// Usage example
const mission = useActiveMission(tabTasks);  // Keep this - it's in task-filter.utils
const filtered = filterTasks(tabTasks, { tabId: activeTabId });  // Use feature instead
```

### Step 2: Update WorkflowSelector (5 mins)

**File:** `src/components/WorkflowSelector.tsx`

```typescript
// OLD
import { selectTab, addNewTab } from '../hooks/useBrowserTabs';

// NEW
import { selectTab, addNewTab, TabItem } from '../features/workflow';

// Usage (no change needed - same function signatures)
const selected = selectTab(tabs, tabId);
const newTabs = addNewTab(tabs, url);
```

### Step 3: Update BrowserTabs (5 mins)

**File:** `src/components/BrowserTabs.tsx`

```typescript
// OLD
import { TabItem } from '../features/browser/types';

// NEW
import { TabItem } from '../features/workflow';  // Tab is a workflow concern
```

### Step 4: Verify Build (5 mins)

```bash
npm run lint  # Check for TypeScript errors
```

### Step 5: Test Manually (10 mins)

1. Create a new workflow
2. Switch between workflows
3. Verify tasks show only for active workflow
4. Check mobile sidebar filters correctly

## One-Liner Changes Checklist

```typescript
// ✅ DONE: workflow feature created
import { selectTab } from '../features/workflow';

// ✅ DONE: tasks feature created
import { getCurrentTaskForMission } from '../features/tasks';

// TODO: Update components
// [ ] WorkflowPanel.tsx — use features/tasks
// [ ] WorkflowSelector.tsx — use features/workflow
// [ ] BrowserTabs.tsx — use features/workflow
// [ ] TaskQueueUI.tsx — use features/tasks

// TODO: Create orchestration hooks
// [ ] useWorkflow.ts — orchestrates workflow + sync
// [ ] useTasks.ts — orchestrates tasks + sync

// TODO: Delete old code
// [ ] Remove duplicate utilities
// [ ] Remove old service functions
// [ ] Clean up imports
```

## Common Patterns

### Pattern 1: Use Pure Functions from Utils
```typescript
// ✅ Good (testable)
const newTabs = selectTab(tabs, tabId);
dispatch({ type: 'SET_TABS', tabs: newTabs });

// ❌ Avoid (side effects)
const newTabs = selectTab(tabs, tabId);
await saveToFirestore(newTabs);  // Do this separately
```

### Pattern 2: Separate Pure Logic from Sync
```typescript
// ✅ Good (layered)
const addWorkflow = async (url: string) => {
    // Step 1: Pure logic
    const newTabs = addNewTab(tabs, url);
    
    // Step 2: Update UI
    setTabs(newTabs);
    
    // Step 3: Sync to backend
    await syncNewTab(userId, tabs, newTabs);
};

// ❌ Avoid (mixing concerns)
const addWorkflow = async (url: string) => {
    // All mixed together
    const newTabs = await syncNewTabAndUpdateUI(url);
};
```

### Pattern 3: Import from Barrel Export
```typescript
// ✅ Good (one-liner)
import { selectTab, addNewTab, TabItem, syncNewTab } from '../features/workflow';

// ❌ Avoid (multiple imports)
import { selectTab } from '../features/workflow/workflow.utils';
import { addNewTab } from '../features/workflow/workflow.utils';
import { TabItem } from '../features/workflow/workflow.types';
import { syncNewTab } from '../features/workflow/workflow.service';
```

## Troubleshooting

### Error: "Cannot find module '../features/workflow'"
- Make sure you created `src/features/workflow/` with all 4 files
- Check `index.ts` has correct exports

### Error: "selectTab is not exported"
- Check `src/features/workflow/index.ts` includes the export
- Verify function exists in `workflow.utils.ts`

### TypeScript Error: "Type 'TabItem' is not assignable"
- Import types from features: `import { TabItem } from '../features/workflow'`
- Don't mix types from old and new locations

## Benefits After This Refactoring

1. **Cleaner Imports** — One import per feature vs. 5-10 scattered imports
2. **Better Testing** — Pure functions in utils are easy to test
3. **Easier Maintenance** — Related code is grouped together
4. **Prevents Bugs** — Clear contracts between modules
5. **Faster Development** — Find code faster, modify faster

## File Organization After

```
src/
├── features/
│   ├── workflow/           ← Tab/workflow state
│   │   ├── index.ts
│   │   ├── workflow.types.ts
│   │   ├── workflow.utils.ts
│   │   └── workflow.service.ts
│   ├── tasks/              ← Mission tasks
│   │   ├── index.ts
│   │   ├── tasks.types.ts
│   │   ├── tasks.utils.ts
│   │   └── tasks.service.ts
│   └── browser/            ← TODO: Browser automation
│
├── components/             ← UI layer
│   ├── WorkflowSelector.tsx (uses workflow feature)
│   ├── WorkflowPanel.tsx    (uses tasks feature)
│   └── ...
│
├── hooks/                  ← Orchestration layer
│   ├── useWorkflow.ts      (orchestrates workflow)
│   ├── useTasks.ts         (orchestrates tasks)
│   └── ...
│
└── ... (rest of structure)
```

## Deployment Checklist

- [ ] Created feature modules (workflow, tasks)
- [ ] Updated component imports (WorkflowPanel, WorkflowSelector, BrowserTabs)
- [ ] Verified TypeScript compiles (npm run lint)
- [ ] Tested manually (create workflow, switch, verify tasks)
- [ ] No broken imports
- [ ] No console errors
- [ ] Mobile sidebar still filters by tab
- [ ] Execution lock still prevents dual execution

## Success Criteria

✅ Import statements use `../features/workflow` and `../features/tasks`
✅ No TypeScript errors on `npm run lint`
✅ Components import types and functions from features
✅ Pure functions (utils) have no Firestore imports
✅ Service functions handle all async operations
✅ All barrel exports are in index.ts
✅ Each file is under 100 lines

---

**Time to Complete:** 30 minutes
**Difficulty:** Easy
**Risk:** Low (non-breaking changes)

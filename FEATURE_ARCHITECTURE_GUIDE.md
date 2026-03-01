/*
 * [Feature Architecture Guide]
 * [Status] ✅ LIVE
 * How to use the new modular architecture
 */

# Feature Architecture Quick Reference

## The Pattern

Each feature follows: **types → utils → service → index (barrel export)**

```
src/features/<feature>/
├── <feature>.types.ts      # Interfaces only, no imports
├── <feature>.utils.ts      # Pure functions, no side effects
├── <feature>.service.ts    # Async ops, Firestore sync
└── index.ts                # Barrel export (public API)
```

## Example: Using the Workflow Feature

### Import (One-liner barrel export)
```typescript
import { 
  selectTab, addNewTab, closeTab,          // utils
  syncNewTab, syncCloseTab, listenToWorkflow, // service
  TabItem, WorkflowState                   // types
} from '../features/workflow';
```

### Structure
```typescript
// features/workflow/workflow.types.ts (22 lines)
export interface TabItem { id: string; title: string; isActive: boolean; url: string; }
export interface WorkflowState { tabs: TabItem[]; activeTabId: string; }
export type WorkflowCommand = 'select' | 'create' | 'close' | 'navigate';

// features/workflow/workflow.utils.ts (37 lines)
export const selectTab = (tabs: TabItem[], id: string): TabItem[] => ...
export const addNewTab = (tabs: TabItem[], url: string): TabItem[] => ...
// etc — all pure, testable, no dependencies

// features/workflow/workflow.service.ts (48 lines)
export const syncNewTab = async (userId: string, tab: TabItem) => {
  await setDoc(doc(db, 'users', userId, 'tabs', tab.id), tab);
}
// Firestore operations, real-time listeners

// features/workflow/index.ts (12 lines)
export * from './workflow.types';
export * from './workflow.utils';
export * from './workflow.service';
```

## Using Tasks Feature

```typescript
import {
  getCurrentTaskForMission, filterTasks, getTaskStats, // utils
  syncTaskToFirestore, updateTaskStatusInFirestore, listenToTasks, // service
  TaskItem, TaskStatus, TaskFilter                    // types
} from '../features/tasks';

// Filter tasks by status
const activeTasks = filterTasks(allTasks, { status: 'in_progress' });

// Get stats
const { active, completed, failed } = getTaskStats(allTasks);

// Real-time listener
const unsubscribe = listenToTasks(userId, (tasks) => setTasks(tasks));
```

## Using Hooks for Memoized Values

For expensive operations that need memoization across renders:

```typescript
import { useFilteredTasks } from '../hooks/useFilteredTasks';
import { useActiveMission } from '../hooks/useActiveMission';

export function MyComponent({ tasks }: Props) {
  // Memoized filtering — only recalculates when (tasks, filterType, sortBy) changes
  const filtered = useFilteredTasks(tasks, 'active', 'status');
  
  // Get current mission
  const mission = useActiveMission(tasks);
  
  return (
    <>
      <MissionHeader mission={mission} />
      <TaskList tasks={filtered} />
    </>
  );
}
```

## Shared Services

For cross-feature concerns, use `shared/`:

```typescript
// Shared services (used by multiple features)
import { syncRoutineToFirestore, listenToRoutines } from '../../shared/routine-sync.service';
import { listenToMissions, syncMissionToFirestore } from '../../shared/mission-sync.service';
import { logMissionOutcome, getRelevantOutcomes } from '../../shared/outcome-sync.service';
```

## Rules

1. **Types file** — Interfaces only, no imports (except other types)
2. **Utils file** — Pure functions, no Firestore, no side effects, testable
3. **Service file** — Async ops, Firestore sync, listeners
4. **Index file** — Re-export everything (public API)
5. **100-line law** — Each file ≤ 100 lines (split if needed)
6. **No circular imports** — One direction only: component → hook → feature → shared

## Creating a New Feature

```bash
# Create the directory
mkdir src/features/my-feature

# Create the files with this pattern
touch src/features/my-feature/my-feature.types.ts      # Start with interfaces
touch src/features/my-feature/my-feature.utils.ts      # Add pure functions
touch src/features/my-feature/my-feature.service.ts    # Add async/Firestore
touch src/features/my-feature/index.ts                 # Barrel export
```

## Example: Implementing a New Feature

```typescript
// Step 1: Define types
// src/features/payment/payment.types.ts
export interface Payment { id: string; amount: number; status: 'pending' | 'complete' | 'failed'; }

// Step 2: Add utilities
// src/features/payment/payment.utils.ts
export const calculateTotal = (payments: Payment[]): number => 
  payments.reduce((sum, p) => sum + p.amount, 0);

export const getPaymentStatus = (payments: Payment[]) => ({
  complete: payments.filter(p => p.status === 'complete').length,
  pending: payments.filter(p => p.status === 'pending').length,
  failed: payments.filter(p => p.status === 'failed').length,
});

// Step 3: Add services
// src/features/payment/payment.service.ts
export const syncPaymentToFirestore = async (payment: Payment) => {
  await setDoc(doc(db, 'payments', payment.id), payment);
};

export const listenToPayments = (userId: string, callback) => {
  return onSnapshot(query(collection(db, 'payments'), where('user_id', '==', userId)), 
    snap => callback(snap.docs.map(d => d.data())));
};

// Step 4: Create barrel export
// src/features/payment/index.ts
export * from './payment.types';
export * from './payment.utils';
export * from './payment.service';

// Now use it anywhere:
import { calculateTotal, syncPaymentToFirestore, Payment } from '../features/payment';
```

## Backward Compatibility

**Old code continues to work:**
```typescript
// ✅ This still works (routes to new hooks)
import { useFilteredTasks, useActiveMission } from './tasks/task-filter.utils';

// ✅ This also works (direct imports)
import { useFilteredTasks } from '../../hooks/useFilteredTasks';

// ✅ Recommended for new code
import { filterTasks } from '../../features/tasks';
```

The compatibility layer ensures zero breaking changes during migration.

---

**Questions?** Check the feature's `index.ts` — all public APIs are re-exported there.

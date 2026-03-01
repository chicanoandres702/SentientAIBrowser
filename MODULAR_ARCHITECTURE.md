# Modular Feature-Based Architecture

## Current Problem
- Components spread across `src/components/`, hooks in `src/hooks/`, services in `src/services/`
- Difficult to identify feature boundaries
- Code reuse scattered and unclear
- Hard to extract/relocate features

## Solution: Feature-First Organization

```
src/
├── features/                 ← Core feature modules
│   ├── auth/
│   │   ├── auth.types.ts    ← Models & interfaces
│   │   ├── auth.service.ts  ← API/DB logic
│   │   ├── auth.utils.ts    ← Pure functions
│   │   └── index.ts         ← Barrel export
│   │
│   ├── workflow/            ← Tab/workflow management
│   │   ├── workflow.types.ts
│   │   ├── workflow.service.ts
│   │   ├── workflow.utils.ts
│   │   └── index.ts
│   │
│   ├── tasks/              ← Mission task execution
│   │   ├── tasks.types.ts
│   │   ├── tasks.service.ts
│   │   ├── tasks.utils.ts
│   │   └── index.ts
│   │
│   ├── browser/            ← Browser state/tabs
│   │   ├── browser.types.ts
│   │   ├── browser.service.ts
│   │   ├── browser.utils.ts
│   │   └── index.ts
│   │
│   └── ui/                 ← Shared UI primitives
│       ├── ui.types.ts
│       ├── ui.theme.ts
│       └── index.ts
│
├── components/             ← UI layer (use features)
│   ├── Workflow/
│   │   ├── WorkflowSelector.tsx    (uses workflow feature)
│   │   ├── WorkflowPanel.tsx       (uses tasks feature)
│   │   └── index.ts
│   │
│   ├── TaskQueue/
│   │   ├── TaskQueueUI.tsx         (uses tasks feature)
│   │   ├── TaskCard.tsx
│   │   └── index.ts
│   │
│   └── Browser/
│       ├── BrowserTabs.tsx         (uses browser feature)
│       ├── BrowserPreview.tsx
│       └── index.ts
│
├── hooks/                  ← UI logic (orchestrate features)
│   ├── useWorkflow.ts      (orchestrates workflow + tasks)
│   ├── useBrowser.ts       (orchestrates browser + ui)
│   └── index.ts
│
├── layouts/                ← Page composition
│   ├── MainLayout.tsx
│   └── MobileLayout.tsx
│
├── services/               ← Legacy (gradually migrate to features/)
│   └── (deprecated - move to features/)
│
└── utils/                  ← Shared utilities
    ├── sync.utils.ts
    ├── firestore.utils.ts
    └── index.ts
```

## Feature Module Pattern

### 1. Types (`workflow.types.ts`)
```typescript
// All interfaces, enums, types for this feature
export interface TabItem { id: string; title: string; isActive: boolean; url: string; }
export interface WorkflowState { tabs: TabItem[]; activeTabId: string; }
export type WorkflowAction = { type: 'ADD_TAB' } | { type: 'SELECT_TAB'; id: string } | ...
```

### 2. Utils (`workflow.utils.ts`)
```typescript
// Pure functions, no side effects, no imports from services
export const selectTab = (tabs: TabItem[], id: string): TabItem[] =>
    tabs.map(t => ({ ...t, isActive: t.id === id }));

export const addNewTab = (tabs: TabItem[], url: string): TabItem[] =>
    tabs.map(t => ({ ...t, isActive: false })).concat({ id: Date.now().toString(), title: new URL(url).hostname, isActive: true, url });
```

### 3. Service (`workflow.service.ts`)
```typescript
// API calls, Firestore operations, side effects
import { WorkflowAction, WorkflowState } from './workflow.types';
import { addNewTab as addNewTabUtils } from './workflow.utils';

export const syncNewTab = async (tabs: TabItem[], newTab: TabItem): Promise<void> => {
    await setDoc(doc(db, 'users', userId, 'tabs', newTab.id), newTab);
};

export const loadWorkflow = async (userId: string): Promise<WorkflowState> => {
    const tabs = await getDocs(collection(db, 'users', userId, 'tabs'));
    return { tabs: tabs.docs.map(d => d.data()), activeTabId: '...' };
};
```

### 4. Index (`index.ts`) - Barrel Export
```typescript
// Export only what consumers need
export { type TabItem, type WorkflowState } from './workflow.types';
export { selectTab, addNewTab } from './workflow.utils';
export { syncNewTab, loadWorkflow } from './workflow.service';
```

## Consumer Pattern (Hooks)

### Before (Scattered)
```typescript
// useWorkflow.ts uses pieces from 3 different places
import { useBrowserTabs } from './useBrowserTabs';
import { TabItem } from '../features/browser/types';
import { syncNewTab } from '../services/browser-sync-service';
import { selectTab as selectTabFromUtils } from '../utils/browser-utils';
```

### After (Clean)
```typescript
// useWorkflow.ts - orchestrates multiple features
import { selectTab, addNewTab, loadWorkflow } from '../features/workflow';
import { executeTask, getCurrentTask } from '../features/tasks';

export const useWorkflow = (userId: string) => {
    const [state, dispatch] = useReducer(workflowReducer, initialState);

    const selectTab = (tabId: string) => {
        dispatch({ type: 'SELECT_TAB', id: tabId });
    };

    const addTab = async (url: string) => {
        const newTabs = addNewTab(state.tabs, url);
        dispatch({ type: 'SET_TABS', tabs: newTabs });
        await loadWorkflow(userId); // syncs to Firestore
    };

    return { state, selectTab, addTab };
};
```

## Migration Path

### Phase 1: Create New Feature Modules (Non-Breaking)
- Create `src/features/workflow/`
- Create `src/features/tasks/`
- Create `src/features/browser/`
- NO changes to existing code yet

### Phase 2: Update Components (Incremental)
- `WorkflowPanel.tsx` → import from `features/workflow` instead of `hooks/`
- `TaskQueueUI.tsx` → import from `features/tasks`
- `BrowserTabs.tsx` → import from `features/browser`

### Phase 3: Update Hooks (Consolidate)
- `useWorkflow.ts` → orchestrates multiple features
- `useBrowser.ts` → orchestrates browser + ui features
- Remove old scattered hooks

### Phase 4: Cleanup (Remove Old)
- Delete `src/services/` (now in features)
- Consolidate `src/utils/`
- Delete redundant files

## Benefits

1. **Feature Isolation** — All code for a feature in one place
2. **Clear Dependencies** — `features/X/index.ts` shows what's exported
3. **Easier Testing** — Test features independently
4. **Simpler Refactoring** — Move entire feature folder if needed
5. **Code Reuse** — Clear "single source of truth" per feature
6. **Onboarding** — New devs find all related code in one folder
7. **Performance** — Easier code-splitting by feature

## Status

- [ ] Phase 1: Create feature modules
- [ ] Phase 2: Update components to use features
- [ ] Phase 3: Consolidate hooks
- [ ] Phase 4: Remove old structure

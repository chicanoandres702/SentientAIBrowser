// Feature: Workflow | Trace: src/features/workflow/index.ts
/*
 * [Barrel Export] Public API
 * [Constraint] Only export what external consumers need
 * [Law Check] 18 lines | Passed
 */

// Types
export type { TabItem, WorkflowState, WorkflowCommand } from './workflow.types';

// Pure utilities
export { selectTab, addNewTab, closeTab, updateTabUrl, getActiveTab, initialWorkflowState } from './workflow.utils';

// Services (Firestore sync)
export { syncNewTab, syncCloseTab, syncSelectTab, listenToWorkflow } from './workflow.service';

// UI Components
export { WorkflowManager } from './workflow.manager.component';
export { WorkflowSelector } from './workflow.selector.component';

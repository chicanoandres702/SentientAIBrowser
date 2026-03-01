// Feature: Workflow | Trace: src/features/workflow/workflow.types.ts
/*
 * [Core Domain] Tab management and workflow state
 * [Upstream] N/A → [Downstream] Utils/Service
 * [Law Check] 24 lines | Passed
 */

export interface TabItem {
    id: string;
    title: string;
    isActive: boolean;
    url: string;
}

export interface WorkflowState {
    tabs: TabItem[];
    activeTabId: string;
}

export type WorkflowCommand =
    | { type: 'ADD_TAB'; url: string; title?: string }
    | { type: 'CLOSE_TAB'; id: string }
    | { type: 'SELECT_TAB'; id: string }
    | { type: 'UPDATE_TAB'; id: string; url: string }
    | { type: 'SET_TABS'; tabs: TabItem[] };

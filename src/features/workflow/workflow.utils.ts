// Feature: Workflow | Trace: src/features/workflow/workflow.utils.ts
/*
 * [Pure Logic] Tab management utilities
 * [Upstream] State → [Downstream] Reducer
 * [Law Check] 37 lines | Passed
 */

import { TabItem, WorkflowState } from './workflow.types';

export const selectTab = (tabs: TabItem[], id: string): TabItem[] =>
    tabs.map(t => ({ ...t, isActive: t.id === id }));

export const addNewTab = (tabs: TabItem[], url: string, title = 'New Tab'): TabItem[] => {
    const id = Date.now().toString();
    return tabs.map(t => ({ ...t, isActive: false })).concat({
        id,
        title,
        isActive: true,
        url,
    });
};

export const closeTab = (tabs: TabItem[], id: string): TabItem[] => {
    const remaining = tabs.filter(t => t.id !== id);
    // If closed tab was active, activate the previous one
    if (remaining.length > 0 && tabs.find(t => t.id === id)?.isActive) {
        remaining[0].isActive = true;
    }
    return remaining;
};

export const updateTabUrl = (tabs: TabItem[], id: string, url: string): TabItem[] =>
    tabs.map(t => (t.id === id ? { ...t, url } : t));

export const getActiveTab = (tabs: TabItem[]): TabItem | null =>
    tabs.find(t => t.isActive) || null;

export const initialWorkflowState = (): WorkflowState => ({
    tabs: [{ id: '1', title: 'New Tab', isActive: true, url: 'https://www.google.com' }],
    activeTabId: '1',
});

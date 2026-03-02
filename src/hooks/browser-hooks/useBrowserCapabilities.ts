// Feature: Browser | Trace: README.md
/*
 * [Parent Feature/Milestone] Core Browser
 * [Child Task/Issue] useSentientBrowser refactor
 * [Subtask] Core browser state composition - tabs, tasks, window dimensions
 * [Upstream] React hooks -> [Downstream] Browser state and controls
 * [Law Check] 45 lines | Passed 100-Line Law
 */
import { useRef, useCallback } from 'react';
import { useWindowDimensions } from 'react-native';
import { HeadlessWebViewRef } from '@features/browser';
import { useBrowserState } from '../useBrowserState';
import { useBrowserTabs } from '../useBrowserTabs';
import { useTaskQueue } from '../useTaskQueue';
import { useWorkflows } from '../useWorkflows';

/** Core browser capabilities — state, tabs, tasks, dimensions, and workflow grouping */
export const useBrowserCapabilities = () => {
    const s = useBrowserState();
    const { tabs, setTabs, activeUrl, setActiveUrl, navigateActiveTab, addNewTab: rawAddNewTab, closeTab: rawCloseTab, selectTab } = useBrowserTabs('about:blank');
    const { tasks, setTasks, addTask, updateTask, removeTask, clearTasks, editTask, reorderMissions, removeMissionTasks, removeTabTasks } = useTaskQueue();
    const { workflows, activeWorkflowId, selectWorkflow, addWorkflow, removeWorkflow, addTabToWorkflow, removeTabFromAll } = useWorkflows('1');
    const webViewRef = useRef<HeadlessWebViewRef>(null!);
    const { width: winWidth } = useWindowDimensions();
    const previewWidth = Math.min(winWidth * 0.7, 1200);
    const previewHeight = previewWidth * 0.6;
    const activeTab = tabs.find((t) => t.isActive);
    const activeHost = activeUrl ? new URL(activeUrl).hostname : '';

    // Why: when a new tab is opened, register it in the active workflow so the tab bar filters correctly
    const addNewTab = useCallback(async (url: string, title?: string): Promise<string> => {
        const id = await rawAddNewTab(url, title);
        addTabToWorkflow(activeWorkflowId, id);
        return id;
    }, [rawAddNewTab, addTabToWorkflow, activeWorkflowId]);

    // Why: when a tab closes, remove it from all workflows so stale tabIds don't linger
    const closeTab = useCallback(async (id: string) => {
        removeTabFromAll(id);
        await rawCloseTab(id);
    }, [rawCloseTab, removeTabFromAll]);

    // Why: atomically create a new workflow + first tab; uses rawAddNewTab so the tab
    // isn't double-registered — addWorkflow(tabId) registers it directly in the new workflow.
    const createWorkspaceTab = useCallback(async (): Promise<void> => {
        const id = await rawAddNewTab('about:blank', 'New Tab');
        addWorkflow(undefined, id);
    }, [rawAddNewTab, addWorkflow]);

    return {
        // Browser state
        s,
        // Tabs
        tabs,
        setTabs,
        activeUrl,
        setActiveUrl,
        navigateActiveTab,
        addNewTab,
        closeTab,
        selectTab,
        activeTab,
        activeTabId: activeTab?.id,
        // Workflows
        workflows,
        activeWorkflowId,
        selectWorkflow,
        addWorkflow,
        removeWorkflow,
        addTabToWorkflow,
        createWorkspaceTab,
        // Tasks
        tasks,
        setTasks,
        addTask,
        updateTask,
        removeTask,
        clearTasks,
        editTask,
        reorderMissions,
        removeMissionTasks,
        removeTabTasks,
        // Dimensions
        previewWidth,
        previewHeight,
        // Host
        activeHost,
        webViewRef,
    };
};

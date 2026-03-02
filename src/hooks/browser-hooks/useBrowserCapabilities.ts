// Feature: Browser | Trace: README.md
/*
 * [Parent Feature/Milestone] Core Browser
 * [Child Task/Issue] useSentientBrowser refactor
 * [Subtask] Core browser state composition - tabs, tasks, window dimensions
 * [Upstream] React hooks -> [Downstream] Browser state and controls
 * [Law Check] 45 lines | Passed 100-Line Law
 */
import { useRef } from 'react';
import { useWindowDimensions } from 'react-native';
import { HeadlessWebViewRef } from '@features/browser';
import { useBrowserState } from '../useBrowserState';
import { useBrowserTabs } from '../useBrowserTabs';
import { useTaskQueue } from '../useTaskQueue';

/** Core browser capabilities — state, tabs, tasks, and dimensions */
export const useBrowserCapabilities = () => {
    const s = useBrowserState();
    const { tabs, setTabs, activeUrl, setActiveUrl, navigateActiveTab, addNewTab, closeTab, selectTab } = useBrowserTabs('about:blank');
    const { tasks, setTasks, addTask, updateTask, removeTask, clearTasks, editTask, reorderMissions, removeMissionTasks, removeTabTasks } = useTaskQueue();
    const webViewRef = useRef<HeadlessWebViewRef>(null!);
    const { width: winWidth } = useWindowDimensions();
    const previewWidth = Math.min(winWidth * 0.7, 1200);
    const previewHeight = previewWidth * 0.6;
    const activeTab = tabs.find((t) => t.isActive);
    const activeHost = activeUrl ? new URL(activeUrl).hostname : '';

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

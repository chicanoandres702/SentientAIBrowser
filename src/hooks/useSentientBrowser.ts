// Feature: Core | Trace: README.md
import { useRef, useEffect, useState } from 'react';
import { HeadlessWebViewRef } from '../components/HeadlessWebView';
import { planTaskBreakdown } from '../features/llm/llm-task-planner.engine';
import { useUrlTracker } from './useUrlTracker';
import { AppTheme } from '../../App';
import { useBrowserState } from './useBrowserState';
import { useBrowserTabs } from './useBrowserTabs';
import { useTaskQueue } from './useTaskQueue';
import { useDomDecision } from './useDomDecision';
import { useDomAutoScanner } from './useDomAutoScanner';
import { useBrowserController } from './useBrowserController';
import { detectModeFromUrl } from '../utils/mode-detector';




// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useSentientBrowser = (theme: AppTheme) => {
    const s = useBrowserState();
    const { groups, setGroups, activeGroupId, activeTabId, activeUrl, setActiveUrl, addNewGroup, selectGroup, addNewTab, closeTab, selectTab, setTabState } = useBrowserTabs('https://www.google.com');
    const { tasks, addTask, updateTask, removeTask, clearTasks, editTask } = useTaskQueue();
    const webViewRefs = useRef<Record<string, HeadlessWebViewRef>>({});
    const [globalObjective, setGlobalObjective] = useState('');

    const activeGroup = groups.find(g => g.id === activeGroupId) || groups[0];
    const tabs = activeGroup?.tabs || [];
    const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

    const activePrompt = activeTab?.activePrompt ?? '';
    const statusMessage = activeTab?.statusMessage ?? 'Ready';
    const isPaused = activeTab?.isPaused ?? true;
    const retryCount = activeTab?.retryCount ?? 0;
    const taskStartTime = activeTab?.taskStartTime ?? null;

    const setActivePrompt = (p: string) => setTabState(activeTabId, { activePrompt: p });
    const setStatusMessage = (m: string) => setTabState(activeTabId, { statusMessage: m });
    const setIsPaused = (p: boolean) => setTabState(activeTabId, { isPaused: p });
    const setRetryCount = (n: number) => setTabState(activeTabId, { retryCount: n });
    const setTaskStartTime = (t: number | null) => setTabState(activeTabId, { taskStartTime: t });

    // Auto-Mode Detection
    useEffect(() => {
        const mode = detectModeFromUrl(activeUrl);
        if (mode === 'scholar') {
            s.setIsScholarMode(true);
        } else if (mode === 'survey') {
            s.setIsScholarMode(false);
        }
    }, [activeUrl]);

    // Removed GitHub actions from frontend - managed by orchestrator




    // Simplified sync - managed by development orchestrator


    useUrlTracker(activeUrl, tasks.map(t => t.id), s.sessionAnswerIds);

    // AI Task Consumer Loop
    useEffect(() => {
        if (isPaused || tasks.length === 0) return;

        const nextPending = tasks.find(t => t.status === 'pending');
        const hasInProgress = tasks.some(t => t.status === 'in_progress');

        if (!nextPending && !hasInProgress) {
            // Why: all tasks consumed — queue is exhausted. Pause and notify.
            setIsPaused(true);
            setStatusMessage('All Tasks Complete');
            return;
        }

        if (!activePrompt && nextPending && !hasInProgress) {
            updateTask(nextPending.id, 'in_progress');
            setActivePrompt(nextPending.title);
            setStatusMessage(`Executing: ${nextPending.title}...`);
            webViewRefs.current[activeTabId]?.scanDOM();
        }
    }, [tasks, activePrompt, isPaused, activeTabId]);

    const handleReassessPlan = async (reasoning: string) => {
        setTabState(activeTabId, { isPaused: true, statusMessage: 'Reassessing Plan...' });
        const plan = await planTaskBreakdown(`Global Objective: ${globalObjective}\nFailure Reason: ${reasoning}`, s.geminiApiKey);
        if (plan && plan.tasks) {
            clearTasks();
            for (const t of plan.tasks) {
                addTask(t, 'pending');
            }
            setTabState(activeTabId, { activePrompt: '', isPaused: false });
        }
    };

    const { handleDomMapReceived } = useDomDecision(
        groups, setTabState, updateTask,
        tasks, webViewRefs, s.setBlockedReason, s.setIsBlockedModalVisible,
        s.lookedUpDocs,
        s.setLookedUpDocs, s.PROXY_BASE_URL, s.isScholarMode,
        s.geminiApiKey,
        s.setIsInteractiveModalVisible, s.setInteractiveRequest, s.setOnInteractiveResponse,
        handleReassessPlan
    );

    useDomAutoScanner(webViewRefs, groups, s.isAIMode);

    const { handleExecutePrompt, toggleDaemon } = useBrowserController(
        webViewRefs, activeTabId, addTask, setActivePrompt, setTaskStartTime,
        setStatusMessage, setIsPaused, s.isDaemonRunning, s.setIsDaemonRunning,
        clearTasks, s.geminiApiKey, setGlobalObjective
    );

    return {
        ...s, groups, setGroups, activeGroupId, activeTabId, activeUrl, setActiveUrl, addNewGroup, selectGroup, addNewTab, closeTab, selectTab,
        tabs, tasks, addTask, updateTask, removeTask, clearTasks, editTask, handleExecutePrompt, toggleDaemon,
        webViewRefs, handleDomMapReceived,
        activePrompt, setActivePrompt, statusMessage, setStatusMessage,
        isPaused, setIsPaused, retryCount, setRetryCount, taskStartTime, setTaskStartTime
    };
};

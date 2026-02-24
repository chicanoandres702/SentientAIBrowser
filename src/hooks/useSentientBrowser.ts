import { useRef, useEffect } from 'react';
import { HeadlessWebViewRef } from '../components/HeadlessWebView';
import { useUrlTracker } from './useUrlTracker';
import { AppTheme } from '../../App';
import { useBrowserState } from './useBrowserState';
import { useBrowserTabs } from './useBrowserTabs';
import { useTaskQueue } from './useTaskQueue';
import { useDomDecision } from './useDomDecision';
import { useGitHubActions } from './useGitHubActions';
import { useDomAutoScanner } from './useDomAutoScanner';
import { useBrowserController } from './useBrowserController';
import { detectModeFromUrl } from '../utils/mode-detector';

import { useGitAutoCommit } from './useGitAutoCommit';

import { useTaskFileWatcher } from './useTaskFileWatcher';

export const useSentientBrowser = (theme: AppTheme) => {
    const s = useBrowserState();
    const { tabs, setTabs, activeUrl, setActiveUrl, addNewTab, closeTab, selectTab } = useBrowserTabs('https://www.google.com');
    const { tasks, setTasks, addTask, updateTask, removeTask, clearTasks, editTask } = useTaskQueue();
    const webViewRef = useRef<HeadlessWebViewRef>(null);

    // Auto-Mode Detection
    useEffect(() => {
        const mode = detectModeFromUrl(activeUrl);
        if (mode === 'scholar') {
            s.setIsScholarMode(true);
        } else if (mode === 'survey') {
            s.setIsScholarMode(false);
        }
    }, [activeUrl]);

    const {
        handleCreateIssue,
        handleRecordKnowledge,
        handleLookupDocumentation,
        handleSyncTasks
    } = useGitHubActions(s.githubToken, s.repoOwner, s.repoName);

    // Local file watcher for tasks.json
    const { syncTaskToFile } = useTaskFileWatcher(tasks, setTasks);

    // Autonomous Git Engine
    const { handleAutoCommit } = useGitAutoCommit();

    // Sync to GitHub and Auto-Commit whenever tasks change locally (Debounced)
    useEffect(() => {
        if (tasks.length === 0) return;
        
        const timeoutId = setTimeout(() => {
            handleSyncTasks(tasks).then(() => {
                handleAutoCommit("AI: Autonomous Task Sync Update");
            });
        }, 5000);

        return () => clearTimeout(timeoutId);
    }, [tasks]);


    useUrlTracker(activeUrl, tasks.map(t => t.id), s.sessionAnswerIds);

    const { handleDomMapReceived } = useDomDecision(
        s.activePrompt, activeUrl, s.retryCount, s.setRetryCount, updateTask,
        tasks.map(t => t.id), webViewRef, s.setBlockedReason, s.setIsBlockedModalVisible,
        s.setStatusMessage, s.setIsPaused, handleCreateIssue,
        handleRecordKnowledge, handleLookupDocumentation, s.lookedUpDocs,
        s.setLookedUpDocs, s.PROXY_BASE_URL, s.isScholarMode
    );

    useDomAutoScanner(webViewRef, s.isAIMode, s.isPaused, s.activePrompt, s.setStatusMessage);

    const { handleExecutePrompt, toggleDaemon } = useBrowserController(
        webViewRef, addTask, s.setActivePrompt, s.setTaskStartTime,
        s.setStatusMessage, s.setIsPaused, s.isDaemonRunning, s.setIsDaemonRunning
    );

    return {
        ...s, tabs, setTabs, activeUrl, setActiveUrl, addNewTab, closeTab, selectTab,
        tasks, addTask, updateTask, removeTask, clearTasks, editTask, handleExecutePrompt, toggleDaemon,
        webViewRef, handleDomMapReceived
    };
};

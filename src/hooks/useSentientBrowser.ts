// Feature: Core | Trace: README.md
import { useRef, useEffect } from 'react';
import { HeadlessWebViewRef } from '../components/HeadlessWebView';
import { useUrlTracker } from './useUrlTracker';
import { AppTheme } from '../../App';
import { useBrowserState } from './useBrowserState';
import { useBrowserTabs } from './useBrowserTabs';
import { useTaskQueue } from './useTaskQueue';
import { useDomDecision } from './useDomDecision';
import { useDomAutoScanner } from './useDomAutoScanner';
import { useBrowserController } from './useBrowserController';
import { detectModeFromUrl } from '../utils/mode-detector';

import { auth } from '../features/auth/firebase-config';

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

    // Unified Task Tracking (No longer syncing to local file or GitHub)


    useUrlTracker(activeUrl, tasks.map(t => t.id), s.sessionAnswerIds);

    const { handleDomMapReceived } = useDomDecision(
        s.activePrompt, activeUrl, s.retryCount, s.setRetryCount, updateTask,
        tasks.map(t => t.id), webViewRef, s.setBlockedReason, s.setIsBlockedModalVisible,
        s.setStatusMessage, s.setIsPaused, s.lookedUpDocs, s.setLookedUpDocs,
        s.setInteractiveRequest, s.setIsInteractiveModalVisible,
        s.isThinking, s.setIsThinking,
        s.PROXY_BASE_URL, s.isScholarMode
    );

    const handleInteractiveResponse = (response: string | boolean) => {
        s.setIsInteractiveModalVisible(false);
        s.setIsPaused(false);
        s.setInteractiveRequest(null);
        if (response) {
            s.setActivePrompt(prev => `${prev}\n\n[USER RESPONSE]: ${response}`);
            s.setStatusMessage('Resuming with info...');
        } else {
            s.setStatusMessage('Permission Denied');
        }
    };

    useDomAutoScanner(webViewRef, s.isAIMode, s.isPaused, s.activePrompt, s.setStatusMessage, s.isThinking);

    const { handleExecutePrompt, toggleDaemon, handleReload } = useBrowserController(
        webViewRef, addTask, s.setActivePrompt, s.setTaskStartTime,
        s.setStatusMessage, s.setIsPaused, s.isDaemonRunning, s.setIsDaemonRunning
    );

    const activeTab = tabs.find(t => t.isActive);

    return {
        ...s, tabs, setTabs, activeUrl, setActiveUrl, addNewTab, closeTab, selectTab,
        activeTabId: activeTab?.id,
        tasks, addTask, updateTask, removeTask, clearTasks, editTask, 
        handleExecutePrompt: (p: string) => handleExecutePrompt(p, activeTab?.id || 'default', auth.currentUser?.uid || 'anonymous'),
        toggleDaemon,
        handleInteractiveResponse,
        webViewRef, handleDomMapReceived,
        handleReload
    };
};

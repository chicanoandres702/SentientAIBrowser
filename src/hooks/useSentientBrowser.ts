// Feature: Core | Why: Orchestrates all browser hooks into a single composable state object
import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { HeadlessWebViewRef } from '../components/HeadlessWebView';
import { useUrlTracker } from './useUrlTracker';
import { useBrowserState } from './useBrowserState';
import { useBrowserTabs } from './useBrowserTabs';
import { useTaskQueue } from './useTaskQueue';
import { useDomDecision } from './useDomDecision';
import { useDomAutoScanner } from './useDomAutoScanner';
import { useBrowserController } from './useBrowserController';
import { usePlanReassessment } from './usePlanReassessment';
import { useBrowserModeSync } from './useBrowserModeSync';
import { useSessionSync } from '../features/browser/hooks/useSessionSync';
import { useKnowledgeSync } from '../features/browser/hooks/useKnowledgeSync';
import { useCursorController } from './useCursorController';
import { auth } from '../features/auth/firebase-config';
import { useRemoteMirror } from '../features/remote-mirror/useRemoteMirror';
import { sendRemoteAction } from '../features/remote-mirror/remote-mirror.service';
import { useMissionExecutorBridge } from './useMissionExecutorBridge';
import { applyInteractiveResponse, buildWebViewUrl } from './sentient-browser.utils';

export const useSentientBrowser = (_theme?: unknown) => {
    const s = useBrowserState();
    const { tabs, setTabs, activeUrl, setActiveUrl, navigateActiveTab, addNewTab, closeTab, selectTab } = useBrowserTabs('https://www.google.com');
    const { tasks, setTasks, addTask, updateTask, removeTask, clearTasks, editTask } = useTaskQueue();
    const { preStepCheck, postStepRecord, resetHeuristics } = useAgentHeuristics();
    const webViewRef = useRef<HeadlessWebViewRef>(null!);
    const { width: winWidth } = useWindowDimensions();
    // Why: Cursor needs viewport dimensions to scale element rects to container coordinates
    const previewWidth = Math.min(winWidth * 0.7, 1200);
    const previewHeight = previewWidth * 0.6;
    const { cursor, updateDomMap, animateClick, animateType, hideCursor } = useCursorController(previewWidth, previewHeight);
    const cursorActions = { animateClick, animateType, hideCursor };
    const { session, persistSession } = useSessionSync();
    const activeHost = activeUrl ? new URL(activeUrl).hostname : '';
    const { entries: knowledgeEntries, addEntry: addKnowledge } = useKnowledgeSync(activeHost);
    const activeTab = tabs.find(t => t.isActive);

    useBrowserModeSync(activeUrl, s.isRemoteMirrorEnabled, s.setIsScholarMode, navigateActiveTab);

    useEffect(() => {
        if (!s.activePrompt) return;
        resetHeuristics();
    }, [s.activePrompt, resetHeuristics]);

    useUrlTracker(activeUrl, tasks.map(t => t.id), s.sessionAnswerIds);


    const { reassess } = usePlanReassessment({ activePrompt: s.activePrompt, activeUrl, tasks, PROXY_BASE_URL: s.PROXY_BASE_URL, tabId: activeTab?.id || 'default', addTask, updateTask, removeTask, setStatusMessage: s.setStatusMessage });

    const remoteMirror = useRemoteMirror(s.PROXY_BASE_URL, activeTab?.id || 'default', activeUrl, s.isRemoteMirrorEnabled);

    const remoteActions = useMemo(() => (
        s.isRemoteMirrorEnabled
            ? {
                executeAction: (action: 'click' | 'type', targetId: string, value?: string) =>
                    sendRemoteAction(s.PROXY_BASE_URL, activeTab?.id || 'default', activeUrl, action, targetId, value),
            }
            : undefined
    ), [s.isRemoteMirrorEnabled, s.PROXY_BASE_URL, activeTab?.id, activeUrl]);

    useMissionExecutorBridge({
        webViewRef,
        isRemoteMirrorEnabled: s.isRemoteMirrorEnabled,
        setStatusMessage: s.setStatusMessage,
        setActivePrompt: s.setActivePrompt,
        setActiveUrl,
        updateTask,
        remoteActions,
    });

    const { handleDomMapReceived: onDomMap } = useDomDecision(
        s.activePrompt, activeUrl, s.retryCount, updateTask,
        tasks.map(t => t.id), webViewRef, setActiveUrl, navigateActiveTab, s.setBlockedReason, s.setIsBlockedModalVisible,
        s.setStatusMessage, s.setIsPaused, s.lookedUpDocs,
        s.setInteractiveRequest, s.setIsInteractiveModalVisible,
        s.isThinking, s.setIsThinking, s.PROXY_BASE_URL, s.isScholarMode, tasks, reassess,
        preStepCheck, postStepRecord, cursorActions, remoteActions, s.runtimeGeminiApiKey,
    );

    // Bridge: feed DOM map to both decision engine AND cursor coordinate resolver
    const handleDomMapReceived = useCallback((map: any) => { updateDomMap(Array.isArray(map) ? map : []); onDomMap(map); }, [onDomMap, updateDomMap]);

    const handleInteractiveResponse = (response: string | boolean) => applyInteractiveResponse(response, s.setIsInteractiveModalVisible, s.setIsPaused, s.setInteractiveRequest, s.setActivePrompt, s.setStatusMessage);

    useDomAutoScanner(webViewRef, s.isAIMode && !s.isRemoteMirrorEnabled, s.isPaused, s.activePrompt, s.setStatusMessage, s.isThinking);

    useEffect(() => {
        if (!s.isRemoteMirrorEnabled || !remoteMirror.domMap.length) return;
        handleDomMapReceived(remoteMirror.domMap);
    }, [s.isRemoteMirrorEnabled, remoteMirror.domMap, handleDomMapReceived]);

    const { handleExecutePrompt, toggleDaemon, handleReload } = useBrowserController(
        webViewRef, addTask, s.setActivePrompt, s.setTaskStartTime,
        s.setStatusMessage, s.setIsPaused, s.isDaemonRunning, s.setIsDaemonRunning, s.PROXY_BASE_URL,
    );

    const webViewUrl = buildWebViewUrl(s.useProxy, s.PROXY_BASE_URL, activeUrl, activeTab?.id);

    return {
        ...s, tabs, setTabs, activeUrl, setActiveUrl, navigateActiveTab, navigateWithGuard, addNewTab, closeTab: closeTabWithCleanup, selectTab,
        activeTabId: activeTab?.id, webViewUrl, tasks, addTask, updateTask, removeTask, clearTasks, editTask,
        session, persistSession, knowledgeEntries, addKnowledge,
        handleExecutePrompt: (p: string) => handleExecutePrompt(p, activeTab?.id || 'default', auth.currentUser?.uid || 'anonymous'),
        toggleDaemon, handleInteractiveResponse, webViewRef, handleDomMapReceived, handleReload,
        cursor, cursorActions, remoteMirror, handleManualClick, handleManualType, handleManualKeyPress,
    };
};

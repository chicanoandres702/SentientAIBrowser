// Feature: Core | Why: Orchestrates all browser hooks into a single composable state object
import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { HeadlessWebViewRef } from '../components/HeadlessWebView';
import { useUrlTracker } from './useUrlTracker';
import { AppTheme } from '../../App';
import { useBrowserState } from './useBrowserState';
import { useBrowserTabs } from './useBrowserTabs';
import { useTaskQueue } from './useTaskQueue';
import { useDomDecision } from './useDomDecision';
import { useDomAutoScanner } from './useDomAutoScanner';
import { useBrowserController } from './useBrowserController';
import { usePlanReassessment } from './usePlanReassessment';
import { detectModeFromUrl } from '../utils/mode-detector';
import { useSessionSync } from '../features/browser/hooks/useSessionSync';
import { useKnowledgeSync } from '../features/browser/hooks/useKnowledgeSync';
import { useCursorController } from './useCursorController';
import { auth } from '../features/auth/firebase-config';
import { missionTaskExecutor } from '../services/mission-task.executor';
import { useRemoteMirror } from '../features/remote-mirror/useRemoteMirror';
import { sendRemoteAction } from '../features/remote-mirror/remote-mirror.service';

export const useSentientBrowser = (theme: AppTheme) => {
    const s = useBrowserState();
    const { tabs, setTabs, activeUrl, setActiveUrl, navigateActiveTab, addNewTab, closeTab, selectTab } = useBrowserTabs('https://www.google.com');
    const { tasks, setTasks, addTask, updateTask, removeTask, clearTasks, editTask } = useTaskQueue();
    const webViewRef = useRef<HeadlessWebViewRef>(null!);
    const { width: winWidth } = useWindowDimensions();
    // Why: Cursor needs viewport dimensions to scale element rects to container coordinates
    const previewWidth = Math.min(winWidth * 0.7, 1200);
    const previewHeight = previewWidth * 0.6;
    const { cursor, updateDomMap, animateClick, animateType, hideCursor, showAt } = useCursorController(previewWidth, previewHeight);
    const cursorActions = { animateClick, animateType, hideCursor };
    const { session, persistSession } = useSessionSync();
    const activeHost = activeUrl ? new URL(activeUrl).hostname : '';
    const { entries: knowledgeEntries, addEntry: addKnowledge } = useKnowledgeSync(activeHost);
    const activeTab = tabs.find(t => t.isActive);

    const DEFAULT_REMOTE_URL = 'https://www.google.com';

    useEffect(() => {
        const mode = detectModeFromUrl(activeUrl);
        if (mode === 'scholar') s.setIsScholarMode(true);
        else if (mode === 'survey') s.setIsScholarMode(false);
    }, [activeUrl]);

    useEffect(() => {
        if (!s.isRemoteMirrorEnabled) return;
        if (!activeUrl || activeUrl === 'about:blank') navigateActiveTab(DEFAULT_REMOTE_URL);
    }, [s.isRemoteMirrorEnabled, activeUrl, navigateActiveTab]);

    useUrlTracker(activeUrl, tasks.map(t => t.id), s.sessionAnswerIds);


    const { reassess } = usePlanReassessment({
        activePrompt: s.activePrompt, activeUrl, tasks, PROXY_BASE_URL: s.PROXY_BASE_URL,
        tabId: activeTab?.id || 'default', addTask, updateTask, removeTask, setStatusMessage: s.setStatusMessage,
    });

    const remoteMirror = useRemoteMirror(
        s.PROXY_BASE_URL,
        activeTab?.id || 'default',
        activeUrl,
        s.isRemoteMirrorEnabled,
    );

    const remoteActions = useMemo(() => (
        s.isRemoteMirrorEnabled
            ? {
                executeAction: (action: 'click' | 'type', targetId: string, value?: string) =>
                    sendRemoteAction(s.PROXY_BASE_URL, activeTab?.id || 'default', activeUrl, action, targetId, value),
            }
            : undefined
    ), [s.isRemoteMirrorEnabled, s.PROXY_BASE_URL, activeTab?.id, activeUrl]);

    // Start mission task executor when component mounts
    useEffect(() => {
        if (auth.currentUser && (webViewRef.current || s.isRemoteMirrorEnabled)) {
            missionTaskExecutor.start({
                webViewRef,
                setStatusMessage: s.setStatusMessage,
                setActivePrompt: s.setActivePrompt,
                setActiveUrl,
                updateTask,
                remoteActions,
            });
        }
        return () => missionTaskExecutor.stop();
    }, [auth.currentUser, updateTask, s.setStatusMessage, s.setActivePrompt, s.isRemoteMirrorEnabled, remoteActions]);

    const { handleDomMapReceived: onDomMap } = useDomDecision(
        s.activePrompt, activeUrl, s.retryCount, s.setRetryCount, updateTask,
        tasks.map(t => t.id), webViewRef, setActiveUrl, navigateActiveTab, s.setBlockedReason, s.setIsBlockedModalVisible,
        s.setStatusMessage, s.setIsPaused, s.lookedUpDocs, s.setLookedUpDocs,
        s.setInteractiveRequest, s.setIsInteractiveModalVisible,
        s.isThinking, s.setIsThinking, s.PROXY_BASE_URL, s.isScholarMode, tasks, reassess,
        undefined, undefined, cursorActions, remoteActions,
    );

    // Bridge: feed DOM map to both decision engine AND cursor coordinate resolver
    const handleDomMapReceived = useCallback((map: any) => {
        updateDomMap(Array.isArray(map) ? map : []);
        onDomMap(map);
    }, [onDomMap, updateDomMap]);

    const handleInteractiveResponse = (response: string | boolean) => {
        s.setIsInteractiveModalVisible(false); s.setIsPaused(false); s.setInteractiveRequest(null);
        if (response) { s.setActivePrompt(prev => `${prev}\n\n[USER RESPONSE]: ${response}`); s.setStatusMessage('Resuming...'); }
        else { s.setStatusMessage('Permission Denied'); }
    };

    const shouldScan = s.isAIMode && !s.isRemoteMirrorEnabled;
    useDomAutoScanner(webViewRef, shouldScan, s.isPaused, s.activePrompt, s.setStatusMessage, s.isThinking);

    useEffect(() => {
        if (!s.isRemoteMirrorEnabled) return;
        if (!remoteMirror.domMap.length) return;
        handleDomMapReceived(remoteMirror.domMap);
    }, [s.isRemoteMirrorEnabled, remoteMirror.domMap, handleDomMapReceived]);

    const { handleExecutePrompt, toggleDaemon, handleReload } = useBrowserController(
        webViewRef, addTask, s.setActivePrompt, s.setTaskStartTime,
        s.setStatusMessage, s.setIsPaused, s.isDaemonRunning, s.setIsDaemonRunning, s.PROXY_BASE_URL,
    );

    const webViewUrl = (s.useProxy && s.PROXY_BASE_URL)
        ? `${s.PROXY_BASE_URL}/proxy?url=${encodeURIComponent(activeUrl)}&tabId=${activeTab?.id || 'default'}` : activeUrl;

    return {
        ...s, tabs, setTabs, activeUrl, setActiveUrl, navigateActiveTab, addNewTab, closeTab, selectTab,
        activeTabId: activeTab?.id, webViewUrl, tasks, addTask, updateTask, removeTask, clearTasks, editTask,
        session, persistSession, knowledgeEntries, addKnowledge,
        handleExecutePrompt: (p: string) => handleExecutePrompt(p, activeTab?.id || 'default', auth.currentUser?.uid || 'anonymous'),
        toggleDaemon, handleInteractiveResponse, webViewRef, handleDomMapReceived, handleReload,
        cursor, cursorActions, remoteMirror,
    };
};

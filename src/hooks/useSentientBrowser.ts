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
import { useNavigationController } from './useNavigationController';
import { useAgentHeuristics } from './useAgentHeuristics';

export const useSentientBrowser = (theme: AppTheme) => {
    const s = useBrowserState();
    const { tabs, setTabs, activeUrl, setActiveUrl, navigateActiveTab, addNewTab, closeTab, selectTab } = useBrowserTabs('https://www.google.com');
    const { tasks, setTasks, addTask, updateTask, removeTask, clearTasks, editTask } = useTaskQueue();
    const { preStepCheck, postStepRecord, resetHeuristics } = useAgentHeuristics();
    const webViewRef = useRef<HeadlessWebViewRef>(null!);
    const { width: winWidth } = useWindowDimensions();
    // Why: Cursor needs viewport dimensions to scale element rects to container coordinates
    const previewWidth = Math.min(winWidth * 0.7, 1200);
    const previewHeight = previewWidth * 0.6;
    const { cursor, updateDomMap, animateClick, animateType, hideCursor, showAt, clickAt } = useCursorController(previewWidth, previewHeight);
    const cursorActions = { animateClick, animateType, hideCursor };
    const { session, persistSession } = useSessionSync();
    const activeHost = activeUrl ? new URL(activeUrl).hostname : '';
    const { entries: knowledgeEntries, addEntry: addKnowledge } = useKnowledgeSync(activeHost);
    const activeTab = tabs.find(t => t.isActive);

    const DEFAULT_REMOTE_URL = 'https://www.google.com';

    // Why: Central nav controller resolves redirects before writing to Firestore.
    // LLM always receives the FINAL settled URL — never the intermediate redirect target.
    const { navigateWithGuard } = useNavigationController(
        s.PROXY_BASE_URL,
        activeTab?.id || 'default',
        navigateActiveTab,
    );

    // Why: lets user click through the screenshot; cursor animates to position and proxy forwards the click
    const handleManualClick = useCallback(async (x: number, y: number, w: number, h: number) => {
        clickAt(x, y);
        if (!s.PROXY_BASE_URL) return;
        const px = Math.round((x / w) * 1280);
        const py = Math.round((y / h) * 800);
        const tabId = tabs.find(t => t.isActive)?.id || 'default';
        try {
            const res = await fetch(`${s.PROXY_BASE_URL}/proxy/click`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ x: px, y: py, tabId }),
            });
            if (res.ok) {
                const { finalUrl } = await res.json();
                // If the click triggered navigation, update the active tab immediately
                // — don’t wait for the 5s captureAndSync interval to propagate the change
                if (finalUrl && finalUrl !== activeUrl) {
                    await navigateWithGuard(finalUrl);
                }
            }
        } catch { /* non-fatal */ }
    }, [clickAt, s.PROXY_BASE_URL, tabs, activeUrl, navigateWithGuard]);

    // Why: forward individual keystrokes / special keys to Playwright's focused element
    const handleManualType = useCallback((char: string) => {
        if (!s.PROXY_BASE_URL) return;
        const tabId = activeTab?.id || 'default';
        fetch(`${s.PROXY_BASE_URL}/proxy/type`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: char, tabId }),
        }).catch(() => {});
    }, [s.PROXY_BASE_URL, activeTab?.id]);

    const handleManualKeyPress = useCallback((key: string) => {
        if (!s.PROXY_BASE_URL) return;
        const tabId = activeTab?.id || 'default';
        fetch(`${s.PROXY_BASE_URL}/proxy/type`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, tabId }),
        }).catch(() => {});
    }, [s.PROXY_BASE_URL, activeTab?.id]);

    // Why: detect scholar/survey mode from URL changes and sync to state
    useEffect(() => {
        const mode = detectModeFromUrl(activeUrl);
        if (mode === 'scholar') s.setIsScholarMode(true);
        else if (mode === 'survey') s.setIsScholarMode(false);
    }, [activeUrl]);

    // Why: Playwright is command center — on mount (or when proxy URL is first known)
    // push the current activeUrl directly to Playwright so the page initialises without
    // needing a Firestore listener to trigger it.
    useEffect(() => {
        if (s.PROXY_BASE_URL && activeUrl && activeUrl !== 'about:blank') {
            navigateWithGuard(activeUrl);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [s.PROXY_BASE_URL]); // intentionally runs only when proxy URL becomes known

    // Why: call DELETE /proxy/tab/:id BEFORE removing from Firestore so the backend
    // clears its captureAndSync interval first — prevents the interval from
    // re-creating the Firestore doc that syncCloseTab is about to delete.
    const closeTabWithCleanup = useCallback(async (id: string) => {
        if (s.PROXY_BASE_URL) {
            fetch(`${s.PROXY_BASE_URL}/proxy/tab/${id}`, { method: 'DELETE' }).catch(() => {});
        }
        await closeTab(id);
    }, [closeTab, s.PROXY_BASE_URL]);

    useEffect(() => {
        if (!s.isRemoteMirrorEnabled) return;
        if (!activeUrl || activeUrl === 'about:blank') navigateActiveTab(DEFAULT_REMOTE_URL);
    }, [s.isRemoteMirrorEnabled, activeUrl, navigateActiveTab]);

    useEffect(() => {
        if (!s.activePrompt) return;
        resetHeuristics();
    }, [s.activePrompt, resetHeuristics]);

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

    // Why: Playwright is command center — ALL LLM click/type actions go to the proxy
    // regardless of remote-mirror mode. undefined only when proxy isn't configured.
    const remoteActions = useMemo(() => s.PROXY_BASE_URL ? {
        executeAction: async (action: 'click' | 'type', targetId: string | undefined, value?: string, ariaSelector?: { role?: string; name?: string; text?: string }): Promise<void> => {
            await sendRemoteAction(s.PROXY_BASE_URL!, activeTab?.id || 'default', activeUrl, action, targetId, value, ariaSelector);
        },
    } : undefined, [s.PROXY_BASE_URL, activeTab?.id, activeUrl]);

    // Why: When PROXY_BASE_URL is set the Cloud Run backend-mission.executor is the sole
    // Playwright commander. Starting missionTaskExecutor here would cause a race condition
    // (both backend and frontend issuing actions on the same page simultaneously).
    // missionTaskExecutor only runs in offline/HeadlessWebView fallback mode.
    useEffect(() => {
        if (!auth.currentUser || s.PROXY_BASE_URL) return;
        missionTaskExecutor.start({
            webViewRef,
            setStatusMessage: s.setStatusMessage,
            setActivePrompt: s.setActivePrompt,
            setActiveUrl,
            updateTask,
            remoteActions,
        });
        return () => missionTaskExecutor.stop();
    }, [!!auth.currentUser, s.PROXY_BASE_URL, updateTask, s.setStatusMessage, s.setActivePrompt, remoteActions]);

    const { handleDomMapReceived: onDomMap } = useDomDecision(
        s.activePrompt, activeUrl, s.retryCount, s.setRetryCount, updateTask,
        tasks.map(t => t.id), webViewRef, setActiveUrl, navigateWithGuard, s.setBlockedReason, s.setIsBlockedModalVisible,
        s.setStatusMessage, s.setIsPaused, s.lookedUpDocs, s.setLookedUpDocs,
        s.setInteractiveRequest, s.setIsInteractiveModalVisible,
        s.isThinking, s.setIsThinking, s.PROXY_BASE_URL, s.isScholarMode, tasks, reassess,
        preStepCheck, postStepRecord, cursorActions, remoteActions, s.runtimeGeminiApiKey,
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
        ...s, tabs, setTabs, activeUrl, setActiveUrl, navigateActiveTab, navigateWithGuard, addNewTab, closeTab: closeTabWithCleanup, selectTab,
        activeTabId: activeTab?.id, webViewUrl, tasks, addTask, updateTask, removeTask, clearTasks, editTask,
        session, persistSession, knowledgeEntries, addKnowledge,
        handleExecutePrompt: (p: string) => handleExecutePrompt(p, activeTab?.id || 'default', auth.currentUser?.uid || 'anonymous'),
        toggleDaemon, handleInteractiveResponse, webViewRef, handleDomMapReceived, handleReload,
        cursor, cursorActions, remoteMirror, handleManualClick, handleManualType, handleManualKeyPress,
    };
};

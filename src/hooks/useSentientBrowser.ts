// Feature: Core | Why: Orchestrates all browser hooks into a single composable state object
import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { HeadlessWebViewRef } from '../components/HeadlessWebView';
import { useAgentHeuristics } from './useAgentHeuristics';
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
import { useNavigationController } from './useNavigationController';
import { applyInteractiveResponse, buildWebViewUrl } from './sentient-browser.utils';

export const useSentientBrowser = (_theme?: unknown) => {
    const s = useBrowserState();
    const { tabs, setTabs, activeUrl, setActiveUrl, navigateActiveTab, addNewTab, closeTab, selectTab } = useBrowserTabs('https://www.google.com');
    const { tasks, setTasks, addTask, updateTask, removeTask, clearTasks, editTask, reorderMissions, removeMissionTasks, removeTabTasks } = useTaskQueue();
    const { preStepCheck, postStepRecord, resetHeuristics } = useAgentHeuristics();
    const webViewRef = useRef<HeadlessWebViewRef>(null!);
    const { width: winWidth } = useWindowDimensions();
    // Why: Cursor needs viewport dimensions to scale element rects to container coordinates
    const previewWidth = Math.min(winWidth * 0.7, 1200);
    const previewHeight = previewWidth * 0.6;
    const { cursor, updateDomMap, animateClick, animateType, hideCursor, clickAt } = useCursorController(previewWidth, previewHeight);
    const cursorActions = { animateClick, animateType, hideCursor };
    const { session, persistSession } = useSessionSync();
    const activeHost = activeUrl ? new URL(activeUrl).hostname : '';
    const { entries: knowledgeEntries, addEntry: addKnowledge } = useKnowledgeSync(activeHost);
    const activeTab = tabs.find(t => t.isActive);

    const { navigateWithGuard } = useNavigationController(s.PROXY_BASE_URL, activeTab?.id || 'default', navigateActiveTab);

    // Why: closeTab → cancel missions → remove tasks → close Playwright page
    // Uses DELETE /proxy/tab/:tabId which clears the captureAndSync interval cleanly.
    const closeTabWithCleanup = useCallback(async (id: string) => {
        // Cancel any running missions on this tab so the backend loop stops immediately
        const missionTasksForTab = tasks.filter(t => t.isMission && t.tabId === id);
        if (missionTasksForTab.length > 0) {
            try {
                const { doc: fsDoc, updateDoc: fsUpdate } = await import('firebase/firestore');
                const { db: firestoreDb } = await import('../features/auth/firebase-config');
                await Promise.all(missionTasksForTab.map(m =>
                    fsUpdate(fsDoc(firestoreDb, 'missions', m.id), { status: 'cancelled', updatedAt: Date.now() }).catch(() => {})
                ));
            } catch { /* non-fatal */ }
        }
        if (s.PROXY_BASE_URL) {
            await fetch(`${s.PROXY_BASE_URL}/proxy/tab/${id}`, { method: 'DELETE' }).catch(() => {});
        }
        await removeTabTasks(id);
        await closeTab(id);
    }, [closeTab, removeTabTasks, tasks, s.PROXY_BASE_URL]);

    // Why: closeMission cancels the backend loop, clears task_queues, closes the browser tab and its UI card
    const closeMission = useCallback(async (missionId: string, tabId?: string) => {
        // Cancel backend execution — the loop checks this field each iteration
        try {
            const { doc, updateDoc } = await import('firebase/firestore');
            const { db: firestoreDb } = await import('../features/auth/firebase-config');
            await updateDoc(doc(firestoreDb, 'missions', missionId), { status: 'cancelled', updatedAt: Date.now() });
        } catch { /* non-fatal */ }
        await removeMissionTasks(missionId);
        if (tabId) {
            if (s.PROXY_BASE_URL) {
                await fetch(`${s.PROXY_BASE_URL}/proxy/tab/${tabId}`, { method: 'DELETE' }).catch(() => {});
            }
            // Remove the tab card from the UI so the browser card disappears
            await closeTab(tabId);
        }
    }, [removeMissionTasks, closeTab, s.PROXY_BASE_URL]);

    // Why: Manual click/type pass-through to Playwright so the user can interact
    // with the remote screenshot preview directly.
    // The screenshot uses resizeMode="contain" so we must account for letterbox
    // offsets — otherwise clicks in pillar/letterbox bars skew all coordinates.
    const PLAYWRIGHT_W = 1280;
    const PLAYWRIGHT_H = 800;
    const handleManualClick = useCallback(async (x: number, y: number, containerW: number, containerH: number): Promise<void> => {
        // Compute the actual rendered image rect inside the contain-scaled container
        const scale = Math.min(containerW / PLAYWRIGHT_W, containerH / PLAYWRIGHT_H);
        const renderedW = PLAYWRIGHT_W * scale;
        const renderedH = PLAYWRIGHT_H * scale;
        const offsetX = (containerW - renderedW) / 2;
        const offsetY = (containerH - renderedH) / 2;
        // Map click to Playwright viewport coords, clamped to image bounds
        const scaledX = Math.round(Math.max(0, Math.min((x - offsetX) / scale, PLAYWRIGHT_W)));
        const scaledY = Math.round(Math.max(0, Math.min((y - offsetY) / scale, PLAYWRIGHT_H)));
        // Cursor shows at the image-corrected position (offsetX+scaledX*scale = x within image)
        clickAt(offsetX + scaledX * scale, offsetY + scaledY * scale);
        if (!s.PROXY_BASE_URL) return;
        await fetch(`${s.PROXY_BASE_URL}/proxy/click`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ x: scaledX, y: scaledY, tabId: activeTab?.id || 'default', userId: auth.currentUser?.uid || '' }),
        }).catch(() => {});
    }, [s.PROXY_BASE_URL, activeTab?.id, clickAt]);

    const handleManualType = useCallback(async (text: string): Promise<void> => {
        if (!s.PROXY_BASE_URL) return;
        await fetch(`${s.PROXY_BASE_URL}/proxy/type`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, tabId: activeTab?.id || 'default', userId: auth.currentUser?.uid || '' }),
        }).catch(() => {});
    }, [s.PROXY_BASE_URL, activeTab?.id]);

    const handleManualKeyPress = useCallback(async (key: string): Promise<void> => {
        if (!s.PROXY_BASE_URL) return;
        await fetch(`${s.PROXY_BASE_URL}/proxy/type`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, tabId: activeTab?.id || 'default', userId: auth.currentUser?.uid || '' }),
        }).catch(() => {});
    }, [s.PROXY_BASE_URL, activeTab?.id]);

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
                executeAction: async (action: 'click' | 'type', targetId: string | undefined, value?: string, ariaSelector?: { role?: string; name?: string; text?: string }) => {
                    await sendRemoteAction(s.PROXY_BASE_URL, activeTab?.id || 'default', activeUrl, action, targetId, value, ariaSelector);
                },
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

    // Why: Auto-reassess the plan whenever any subtask transitions to completed
    const prevTaskStatuses = useRef<Record<string, string>>({});
    useEffect(() => {
        const prev = prevTaskStatuses.current;
        const anyJustCompleted = tasks.some(t => !t.isMission && t.status === 'completed' && prev[t.id] !== 'completed');
        prevTaskStatuses.current = Object.fromEntries(tasks.map(t => [t.id, t.status]));
        if (anyJustCompleted) reassess();
    }, [tasks, reassess]);

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
        activeTabId: activeTab?.id, webViewUrl, tasks, addTask, updateTask, removeTask, clearTasks, editTask, reorderMissions,
        session, persistSession, knowledgeEntries, addKnowledge,
        handleExecutePrompt: async (p: string) => {
            // Why: each mission gets its own browser tab so the workflow card appears
            // in WorkflowsOverview and all tasks are isolated to that tab.
            const newTabId = await addNewTab('about:blank', 'Mission');
            return handleExecutePrompt(p, newTabId, auth.currentUser?.uid || 'anonymous', s.useConfirmerAgent ?? true);
        },
        toggleDaemon, handleInteractiveResponse, webViewRef, handleDomMapReceived, handleReload,
        cursor, cursorActions, remoteMirror, handleManualClick, handleManualType, handleManualKeyPress,
        closeMission,
    };
};

// Feature: Core | Trace: src/hooks/useSentientBrowser.ts
import { useEffect, useCallback, useRef } from 'react';
import { auth } from '../features/auth/firebase-config';
import { useBrowserCapabilities } from './browser-hooks/useBrowserCapabilities';
import { useBrowserIntegration } from './browser-hooks/useBrowserIntegration';
import { useRemoteSyncBridge } from './browser-hooks/useRemoteSyncBridge';
import { useDomDecision } from './useDomDecision';
import { useDomAutoScanner } from './useDomAutoScanner';
import { useBrowserController } from './useBrowserController';
import { usePlanReassessment } from './usePlanReassessment';
import { useBrowserModeSync } from './useBrowserModeSync';
import { useMissionCleanup, useTabCleanup } from '../features/mission-execution';
import { applyInteractiveResponse, buildWebViewUrl } from './sentient-browser.utils';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useSentientBrowser = (_theme?: unknown) => {
  const cap = useBrowserCapabilities();
  const { heuristics, session, knowledge, navigation, cursor, manual } = useBrowserIntegration(cap.activeUrl, cap.activeTabId, cap.navigateActiveTab, cap.setTasks, cap.tasks, cap.s.PROXY_BASE_URL);
  const { closeMission } = useMissionCleanup({ removeMissionTasks: cap.removeMissionTasks, closeTab: cap.closeTab, PROXY_BASE_URL: cap.s.PROXY_BASE_URL });
  const { closeTabWithCleanup } = useTabCleanup({ removeTabTasks: cap.removeTabTasks, closeTab: cap.closeTab, PROXY_BASE_URL: cap.s.PROXY_BASE_URL, tasks: cap.tasks });
  
  useBrowserModeSync(cap.activeUrl, cap.s.isRemoteMirrorEnabled, cap.s.setIsScholarMode);
  useEffect(() => { if (!cap.s.activePrompt) return; heuristics.resetHeuristics(); }, [cap.s.activePrompt, heuristics]);

  const { reassess } = usePlanReassessment({ activePrompt: cap.s.activePrompt, activeUrl: cap.activeUrl, tasks: cap.tasks, PROXY_BASE_URL: cap.s.PROXY_BASE_URL, tabId: cap.activeTabId || 'default', addTask: cap.addTask, updateTask: cap.updateTask, removeTask: cap.removeTask, setStatusMessage: cap.s.setStatusMessage,
    // Drive immediate execution after re-plan — no waiting for the 10s scan interval
    triggerScan: () => cap.webViewRef.current?.scanDOM(),
  });

  const handleDomMapReceived = useCallback((map: any) => { cursor.updateDomMap(Array.isArray(map) ? map : []); }, [cursor]);
  const handleInteractiveResponse = (response: string | boolean) => applyInteractiveResponse(response, cap.s.setIsInteractiveModalVisible, cap.s.setIsPaused, cap.s.setInteractiveRequest, cap.s.setActivePrompt, cap.s.setStatusMessage);
  
  useDomAutoScanner(cap.webViewRef, cap.s.isAIMode && !cap.s.isRemoteMirrorEnabled, cap.s.isPaused, cap.s.activePrompt, cap.s.setStatusMessage, cap.s.isThinking);

  const prevTaskStatuses = useRef<Record<string, string>>({});
  useEffect(() => {
    const prev = prevTaskStatuses.current;
    const anyJustCompleted = cap.tasks.some(t => !t.isMission && t.status === 'completed' && prev[t.id] !== 'completed');
    prevTaskStatuses.current = Object.fromEntries(cap.tasks.map(t => [t.id, t.status]));
    if (anyJustCompleted) reassess();
  }, [cap.tasks, reassess]);

  const { handleExecutePrompt, toggleDaemon, handleReload } = useBrowserController(cap.webViewRef, cap.addTask, cap.s.setActivePrompt, cap.s.setTaskStartTime, cap.s.setStatusMessage, cap.s.setIsPaused, cap.s.isDaemonRunning, cap.s.setIsDaemonRunning, cap.s.PROXY_BASE_URL, cap.s.runtimeGeminiApiKey);
  const webViewUrl = buildWebViewUrl(cap.s.useProxy, cap.s.PROXY_BASE_URL, cap.activeUrl, cap.activeTab?.id);
  
  const { handleDomMapReceived: onDomMap } = useDomDecision(cap.s.activePrompt, cap.activeUrl, cap.s.retryCount, cap.updateTask, cap.tasks.map(t => t.id), cap.webViewRef, cap.setActiveUrl, navigation.navigateWithGuard, cap.s.setBlockedReason, cap.s.setIsBlockedModalVisible, cap.s.setStatusMessage, cap.s.setIsPaused, cap.s.lookedUpDocs, cap.s.setInteractiveRequest, cap.s.setIsInteractiveModalVisible, cap.s.isThinking, cap.s.setIsThinking, cap.s.PROXY_BASE_URL, cap.s.isScholarMode, cap.tasks, reassess, heuristics.preStepCheck, heuristics.postStepRecord, cursor.cursorActions, undefined, cap.s.runtimeGeminiApiKey, cap.s.isPaused);
  
  const { remoteMirror, remoteActions: _remoteActions } = useRemoteSyncBridge(cap.webViewRef, cap.s.isRemoteMirrorEnabled, cap.s.PROXY_BASE_URL, cap.activeTabId, cap.activeUrl, cap.s.setStatusMessage, cap.s.setActivePrompt, cap.setActiveUrl, cap.updateTask as any, (map) => { handleDomMapReceived(map); onDomMap(map); });

  // Why: closes all proxy Playwright sessions + local tabs in one shot when user exits workspace
  const closeWorkspace = useCallback(async () => {
    const token = await auth.currentUser?.getIdToken().catch(() => '');
    await fetch(`${cap.s.PROXY_BASE_URL}/proxy/close-all`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token || ''}` },
    }).catch(() => {});
    for (const tab of cap.tabs) await closeTabWithCleanup(tab.id).catch(() => {});
  }, [cap.s.PROXY_BASE_URL, cap.tabs, closeTabWithCleanup]);

  return {
    ...cap.s,
    tabs: cap.tabs,
    setTabs: cap.setTabs,
    activeUrl: cap.activeUrl,
    setActiveUrl: cap.setActiveUrl,
    navigateActiveTab: cap.navigateActiveTab,
    navigateWithGuard: navigation.navigateWithGuard,
    navigateBack: navigation.navigateBack,
    navigateForward: navigation.navigateForward,
    addNewTab: cap.addNewTab,
    closeTab: closeTabWithCleanup,
    selectTab: cap.selectTab,
    activeTabId: cap.activeTabId,
    // Workflows — each workflow groups multiple browser tabs
    workflows: cap.workflows,
    activeWorkflowId: cap.activeWorkflowId,
    selectWorkflow: cap.selectWorkflow,
    renameWorkflow: cap.renameWorkflow,
    removeWorkflow: cap.removeWorkflow,
    createWorkspaceTab: cap.createWorkspaceTab,
    addTabToWorkflow: cap.addTabToWorkflow,
    webViewUrl,
    tasks: cap.tasks,
    addTask: cap.addTask,
    updateTask: cap.updateTask,
    removeTask: cap.removeTask,
    clearTasks: cap.clearTasks,
    editTask: cap.editTask,
    reorderMissions: cap.reorderMissions,
    session: session.session,
    persistSession: session.persistSession,
    knowledgeEntries: knowledge.knowledgeEntries,
    addKnowledge: knowledge.addKnowledge,
    handleExecutePrompt: async (p: string) => {
      const seedUrl = cap.activeUrl || 'about:blank';
      const newTabId = await cap.addNewTab(seedUrl, 'Mission');
      return handleExecutePrompt(p, newTabId, auth.currentUser?.uid || 'anonymous', cap.s.useConfirmerAgent ?? true, seedUrl);
    },
    toggleDaemon,
    handleInteractiveResponse,
    webViewRef: cap.webViewRef,
    handleDomMapReceived: (map: any) => { handleDomMapReceived(map); onDomMap(map); },
    handleReload,
    cursor: cursor.cursor,
    cursorActions: cursor.cursorActions,
    remoteMirror,
    handleManualClick: manual.handleManualClick,
    handleManualType: manual.handleManualType,
    handleManualKeyPress: manual.handleManualKeyPress,
    handleManualMouseMove: manual.handleManualMouseMove,
    handleManualScroll: manual.handleManualScroll,
    closeMission,
    closeWorkspace,
  };
};

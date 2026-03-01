// Feature: Core | Trace: src/hooks/useSentientBrowser.ts
import { useEffect, useCallback, useRef } from 'react';
import { auth } from '../features/auth/firebase-config';
import { useBrowserState } from './useBrowserState';
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

export const useSentientBrowser = (_theme?: unknown) => {
  const cap = useBrowserCapabilities();
  const { heuristics, session, knowledge, navigation, cursor, manual } = useBrowserIntegration(cap.activeUrl, cap.activeTabId, cap.navigateActiveTab, cap.setTasks, cap.tasks);
  const { closeMission } = useMissionCleanup({ removeMissionTasks: cap.removeMissionTasks, closeTab: cap.closeTab, PROXY_BASE_URL: cap.s.PROXY_BASE_URL });
  const { closeTabWithCleanup } = useTabCleanup({ removeTabTasks: cap.removeTabTasks, closeTab: cap.closeTab, PROXY_BASE_URL: cap.s.PROXY_BASE_URL, tasks: cap.tasks });
  
  useBrowserModeSync(cap.activeUrl, cap.s.isRemoteMirrorEnabled, cap.s.setIsScholarMode, cap.navigateActiveTab);
  useEffect(() => { if (!cap.s.activePrompt) return; heuristics.resetHeuristics(); }, [cap.s.activePrompt, heuristics]);

  const { reassess } = usePlanReassessment({ activePrompt: cap.s.activePrompt, activeUrl: cap.activeUrl, tasks: cap.tasks, PROXY_BASE_URL: cap.s.PROXY_BASE_URL, tabId: cap.activeTabId || 'default', addTask: cap.addTask, updateTask: cap.updateTask, removeTask: cap.removeTask, setStatusMessage: cap.s.setStatusMessage });

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

  const { handleExecutePrompt, toggleDaemon, handleReload } = useBrowserController(cap.webViewRef, cap.addTask, cap.s.setActivePrompt, cap.s.setTaskStartTime, cap.s.setStatusMessage, cap.s.setIsPaused, cap.s.isDaemonRunning, cap.s.setIsDaemonRunning, cap.s.PROXY_BASE_URL);
  const webViewUrl = buildWebViewUrl(cap.s.useProxy, cap.s.PROXY_BASE_URL, cap.activeUrl, cap.activeTab?.id);
  
  const { handleDomMapReceived: onDomMap } = useDomDecision(cap.s.activePrompt, cap.activeUrl, cap.s.retryCount, cap.updateTask, cap.tasks.map(t => t.id), cap.webViewRef, cap.setActiveUrl, cap.navigateActiveTab, cap.s.setBlockedReason, cap.s.setIsBlockedModalVisible, cap.s.setStatusMessage, cap.s.setIsPaused, cap.s.lookedUpDocs, cap.s.setInteractiveRequest, cap.s.setIsInteractiveModalVisible, cap.s.isThinking, cap.s.setIsThinking, cap.s.PROXY_BASE_URL, cap.s.isScholarMode, cap.tasks, reassess, heuristics.preStepCheck, heuristics.postStepRecord, cursor.cursorActions, undefined, cap.s.runtimeGeminiApiKey);
  
  const { remoteMirror, remoteActions } = useRemoteSyncBridge(cap.webViewRef, cap.s.isRemoteMirrorEnabled, cap.s.PROXY_BASE_URL, cap.activeTabId, cap.activeUrl, cap.s.setStatusMessage, cap.s.setActivePrompt, cap.setActiveUrl, cap.updateTask, (map) => { handleDomMapReceived(map); onDomMap(map); });

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
      const seedUrl = cap.activeUrl || 'https://www.google.com';
      const newTabId = await cap.addNewTab(seedUrl, 'Mission');
      return handleExecutePrompt(p, newTabId, auth.currentUser?.uid || 'anonymous', cap.s.useConfirmerAgent ?? true);
    },
    toggleDaemon,
    handleInteractiveResponse,
    webViewRef: cap.webViewRef,
    handleDomMapReceived: (map: any) => { handleDomMapReceived(map); onDomMap(map); },
    handleReload,
  };
};
    cursor, cursorActions, remoteMirror, handleManualClick, handleManualType, handleManualKeyPress,
    closeMission,
  };
};

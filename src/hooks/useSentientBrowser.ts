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
  // --- Strict 100-line law: split orchestration into sub-hooks ---
  // Core browser state and tab/task/workflow orchestration
  const browserApi = {
    ...useBrowserCapabilities(),
    ...useBrowserIntegration(),
    ...useRemoteSyncBridge(),
    ...useDomDecision(),
    ...useDomAutoScanner(),
    ...useBrowserController(),
    ...usePlanReassessment(),
    ...useMissionCleanup(),
    ...useTabCleanup(),
    ...useBrowserModeSync(),
  };

  // Expose granular API for agent/LLM integration
  return {
    tabs: browserApi.tabs,
    setTabs: browserApi.setTabs,
    activeUrl: browserApi.activeUrl,
    setActiveUrl: browserApi.setActiveUrl,
    workflows: browserApi.workflows,
    activeWorkflowId: browserApi.activeWorkflowId,
    selectWorkflow: browserApi.selectWorkflow,
    renameWorkflow: browserApi.renameWorkflow,
    removeWorkflow: browserApi.removeWorkflow,
    createWorkspaceTab: browserApi.createWorkspaceTab,
    addTabToWorkflow: browserApi.addTabToWorkflow,
    tasks: browserApi.tasks,
    addTask: browserApi.addTask,
    updateTask: browserApi.updateTask,
    removeTask: browserApi.removeTask,
    clearTasks: browserApi.clearTasks,
    editTask: browserApi.editTask,
    reorderMissions: browserApi.reorderMissions,
    session: browserApi.session,
    persistSession: browserApi.persistSession,
    knowledgeEntries: browserApi.knowledgeEntries,
    addKnowledge: browserApi.addKnowledge,
    handleExecutePrompt: browserApi.handleExecutePrompt,
    toggleDaemon: browserApi.toggleDaemon,
    handleInteractiveResponse: browserApi.handleInteractiveResponse,
    webViewRef: browserApi.webViewRef,
    handleDomMapReceived: browserApi.handleDomMapReceived,
    handleReload: browserApi.handleReload,
    cursor: browserApi.cursor,
    cursorActions: browserApi.cursorActions,
    remoteMirror: browserApi.remoteMirror,
    handleManualClick: browserApi.handleManualClick,
    handleManualType: browserApi.handleManualType,
    handleManualKeyPress: browserApi.handleManualKeyPress,
    handleManualMouseMove: browserApi.handleManualMouseMove,
    handleManualScroll: browserApi.handleManualScroll,
    closeMission: browserApi.closeMission,
    closeWorkspace: browserApi.closeWorkspace,
  };
};

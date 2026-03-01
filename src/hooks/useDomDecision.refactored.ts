// Feature: Core | Trace: README.md
/**
 * AIDDE Metadata
 * Purpose: Orchestrator wrapper maintaining backward compatibility
 * Type: Composite hook
 * Max Lines: 100 (target: 85)
 */

import React, { useCallback } from 'react';
import { HeadlessWebViewRef } from '../components/HeadlessWebView';
import { TaskItem } from '../features/tasks/types';
import { useDecisionRouter } from './useDecisionRouter';
import { getCurrentNonMissionTask } from './dom-decision.utils';
import type { CursorActions, RemoteActions } from './dom-action.executor';
import type { HeuristicContext } from './useAgentHeuristics';

interface UseDomDecisionParams {
  activePrompt: string;
  activeUrl: string;
  retryCount: number;
  updateTask: (id: string, status: string, description?: string) => void;
  workflowIds: string[];
  webViewRef: React.RefObject<HeadlessWebViewRef>;
  setActiveUrl: (url: string) => void;
  navigateActiveTab: (url: string) => Promise<void>;
  setBlockedReason: (r: string) => void;
  setIsBlockedModalVisible: (v: boolean) => void;
  setStatusMessage: (m: string) => void;
  setIsPaused: (p: boolean) => void;
  lookedUpDocs: unknown[];
  setInteractiveRequest: (req: { question: string; type: 'confirm' | 'input' } | null) => void;
  setIsInteractiveModalVisible: (v: boolean) => void;
  isThinking: boolean;
  setIsThinking: (t: boolean) => void;
  PROXY_BASE_URL: string;
  isScholarMode?: boolean;
  tasks?: TaskItem[];
  onScanComplete?: () => void;
  getHeuristicContext?: (action: string, url: string, nodeCount: number, pageText?: string) => HeuristicContext;
  onStepOutcome?: (success: boolean) => void;
  cursorActions?: CursorActions;
  remoteActions?: RemoteActions;
  runtimeGeminiApiKey?: string;
}

export const useDomDecision = (params: UseDomDecisionParams) => {
  const routeDecision = useDecisionRouter();

  const handleDomMapReceived = useCallback(async (domMap: unknown) => {
    if (!params.activePrompt || params.isThinking) return;

    const emptyMap = !domMap || (Array.isArray(domMap) ? domMap.length === 0 : Object.keys(domMap as Record<string, unknown>).length === 0);
    if (!params.activeUrl || params.activeUrl === 'about:blank' || emptyMap) return;

    params.setIsThinking(true);

    const currentTask = getCurrentNonMissionTask(params.tasks || []);
    if (currentTask?.status === 'pending') {
      params.updateTask(currentTask.id, 'in_progress', `Executing: ${currentTask.title}`);
    }

    params.setStatusMessage(currentTask ? `Working: ${currentTask.title}` : 'Thinking (Cloud)...');

    try {
      const success = await routeDecision({
        activePrompt: params.activePrompt,
        activeUrl: params.activeUrl,
        retryCount: params.retryCount,
        PROXY_BASE_URL: params.PROXY_BASE_URL,
        isScholarMode: params.isScholarMode ?? false,
        workflowIds: params.workflowIds,
        lookedUpDocs: params.lookedUpDocs,
        runtimeGeminiApiKey: params.runtimeGeminiApiKey,
        domMap,
        taskContext: currentTask ? { taskId: currentTask.id, taskTitle: currentTask.title, subActions: currentTask.subActions } : undefined,
        getHeuristicContext: params.getHeuristicContext,
        webViewRef: params.webViewRef,
        navigateActiveTab: params.navigateActiveTab,
        setActiveUrl: params.setActiveUrl,
        setStatusMessage: params.setStatusMessage,
        setIsPaused: params.setIsPaused,
        setBlockedReason: params.setBlockedReason,
        setIsBlockedModalVisible: params.setIsBlockedModalVisible,
        setInteractiveRequest: params.setInteractiveRequest,
        setIsInteractiveModalVisible: params.setIsInteractiveModalVisible,
        cursorActions: params.cursorActions,
        remoteActions: params.remoteActions,
        onStepOutcome: params.onStepOutcome,
      });

      if (currentTask && !success) {
        params.updateTask(currentTask.id, 'failed', 'Execution failed');
      }
    } catch (error) {
      params.setStatusMessage('Retry required');
      params.onStepOutcome?.(false);
      if (currentTask) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        params.updateTask(currentTask.id, 'failed', `Error: ${errorMsg}`);
      }
    } finally {
      params.setIsThinking(false);
      params.onScanComplete?.();
    }
  }, [params, routeDecision]);

  return { handleDomMapReceived };
};

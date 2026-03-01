// Feature: Core | Trace: README.md
/**
 * AIDDE Metadata
 * Purpose: Orchestrates LLM → validation → execution flow
 * Type: Orchestrator hook
 * Max Lines: 100 (target: 65)
 */

import React, { useCallback } from 'react';
import { useLLMAnalysis } from './useLLMAnalysis';
import { useActionValidator } from './useActionValidator';
import { executeDomAction } from './dom-action.executor';
import { resolveFirstStep } from './dom-decision.utils';
import type { CursorActions, RemoteActions } from './dom-action.executor';

interface DecisionRouterParams {
  activePrompt: string;
  activeUrl: string;
  retryCount: number;
  PROXY_BASE_URL: string;
  isScholarMode: boolean;
  workflowIds: string[];
  lookedUpDocs: unknown[];
  runtimeGeminiApiKey?: string;
  domMap: unknown;
  taskContext?: { taskId: string; taskTitle: string; subActions?: unknown[] };
  getHeuristicContext?: (action: string, url: string, nodeCount: number, pageText?: string) => unknown;
  webViewRef: React.RefObject<unknown>;
  navigateActiveTab?: (url: string) => Promise<void>;
  setActiveUrl?: (url: string) => void;
  setStatusMessage: (m: string) => void;
  setIsPaused: (p: boolean) => void;
  setBlockedReason: (r: string) => void;
  setIsBlockedModalVisible: (v: boolean) => void;
  setInteractiveRequest: (req: { question: string; type: 'confirm' | 'input' } | null) => void;
  setIsInteractiveModalVisible: (v: boolean) => void;
  cursorActions?: CursorActions;
  remoteActions?: RemoteActions;
  onStepOutcome?: (success: boolean) => void;
}

export const useDecisionRouter = (): ((params: DecisionRouterParams) => Promise<boolean>) => {
  const analyzeLLM = useLLMAnalysis();
  const validateAction = useActionValidator();

  return useCallback(async (params: DecisionRouterParams): Promise<boolean> => {
    const analysisResult = await analyzeLLM({
      activePrompt: params.activePrompt,
      activeUrl: params.activeUrl,
      retryCount: params.retryCount,
      PROXY_BASE_URL: params.PROXY_BASE_URL,
      isScholarMode: params.isScholarMode,
      workflowIds: params.workflowIds,
      lookedUpDocs: params.lookedUpDocs,
      runtimeGeminiApiKey: params.runtimeGeminiApiKey,
      domMap: params.domMap,
      taskContext: params.taskContext,
      getHeuristicContext: params.getHeuristicContext,
      setStatusMessage: params.setStatusMessage,
      setIsPaused: params.setIsPaused,
      setBlockedReason: params.setBlockedReason,
      setIsBlockedModalVisible: params.setIsBlockedModalVisible,
    });

    if (analysisResult.error || !analysisResult.decision) {
      params.onStepOutcome?.(false);
      return false;
    }

    const decision = analysisResult.decision as Record<string, unknown>;
    if (!decision.execution) {
      return true;
    }

    const firstStep = resolveFirstStep(decision) as { action: string; explanation?: string } | null;
    if (!firstStep) {
      return true;
    }

    const validation = await validateAction({
      firstStep,
      activePrompt: params.activePrompt,
      activeUrl: params.activeUrl,
    });

    if (!validation.confirmed) {
      params.setStatusMessage(`⚠️ Confirmer rejected: ${validation.reason}`);
      params.onStepOutcome?.(false);
      return false;
    }

    const actionExecuted = await executeDomAction(firstStep, {
      activePrompt: params.activePrompt,
      activeUrl: params.activeUrl,
      webViewRef: params.webViewRef,
      setActiveUrl: params.setActiveUrl,
      navigateActiveTab: params.navigateActiveTab,
      setStatusMessage: params.setStatusMessage,
      setIsPaused: params.setIsPaused,
      setBlockedReason: params.setBlockedReason,
      setIsBlockedModalVisible: params.setIsBlockedModalVisible,
      setInteractiveRequest: params.setInteractiveRequest,
      setIsInteractiveModalVisible: params.setIsInteractiveModalVisible,
      cursorActions: params.cursorActions,
      remoteActions: params.remoteActions,
    });

    params.onStepOutcome?.(actionExecuted);
    return actionExecuted;
  }, [analyzeLLM, validateAction]);
};

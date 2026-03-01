// Feature: Core | Trace: README.md
/**
 * AIDDE Metadata
 * Purpose: Cloud LLM decision call, heuristic injection, nav state assessment
 * Type: Micro-hook
 * Max Lines: 100 (target: 58)
 */

import React, { useCallback } from 'react';
import { auth } from '../features/auth/firebase-config';
import { assessNavState } from '../features/agent/agent-heuristics.service';
import { HeuristicContext } from './useAgentHeuristics';
import { buildDefaultHeuristicPrompt, applyLoginGate } from './dom-decision.utils';

interface LLMAnalysisParams {
  activePrompt: string;
  activeUrl: string;
  retryCount: number;
  PROXY_BASE_URL: string;
  isScholarMode: boolean;
  workflowIds: string[];
  lookedUpDocs: unknown[];
  runtimeGeminiApiKey?: string;
  domMap: unknown;
  taskContext?: {
    taskId: string;
    taskTitle: string;
    subActions?: unknown[];
  };
  getHeuristicContext?: (action: string, url: string, nodeCount: number, pageText?: string) => HeuristicContext;
  setStatusMessage: (m: string) => void;
  setIsPaused: (p: boolean) => void;
  setBlockedReason: (r: string) => void;
  setIsBlockedModalVisible: (v: boolean) => void;
}

interface LLMAnalysisResult {
  decision: unknown;
  heuristicContext: unknown;
  loading: boolean;
  error: string | null;
}

export const useLLMAnalysis = (): ((params: LLMAnalysisParams) => Promise<LLMAnalysisResult>) => {
  return useCallback(async (params: LLMAnalysisParams): Promise<LLMAnalysisResult> => {
    try {
      const domNodeCount = Array.isArray(params.domMap)
        ? params.domMap.length
        : Object.keys(params.domMap as Record<string, unknown>).length;

      const navState = assessNavState(params.activeUrl, domNodeCount);
      if (navState === 'lost') {
        params.setStatusMessage('⚠️ Lost — blank page');
        return { decision: null, heuristicContext: null, loading: false, error: 'Navigation lost' };
      }

      const heuristicCtx = params.getHeuristicContext?.(
        'scan_dom',
        params.activeUrl,
        domNodeCount,
        params.taskContext?.taskTitle,
      );
      const heuristicInjection = heuristicCtx?.promptInjection || buildDefaultHeuristicPrompt(navState);

      const token = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token || 'anonymous'}`,
      };
      if (params.runtimeGeminiApiKey) headers['x-gemini-api-key'] = params.runtimeGeminiApiKey;

      const response = await fetch(`${params.PROXY_BASE_URL}/agent/analyze`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: params.activePrompt + heuristicInjection,
          url: params.activeUrl,
          domMap: params.domMap,
          retryCount: params.retryCount,
          lookedUpDocs: params.lookedUpDocs,
          isScholarMode: params.isScholarMode,
          workflowIds: params.workflowIds,
          currentTask: params.taskContext,
        }),
      });

      if (!response.ok) throw new Error(`Cloud Analysis Failed: ${response.status}`);
      const decision = await response.json();

      const isBlocked = applyLoginGate(
        decision,
        params.setStatusMessage,
        params.setIsPaused,
        params.setBlockedReason,
        params.setIsBlockedModalVisible,
      );

      if (isBlocked) {
        return { decision: null, heuristicContext: heuristicCtx, loading: false, error: 'Login gate triggered' };
      }

      return { decision, heuristicContext: heuristicCtx, loading: false, error: null };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return { decision: null, heuristicContext: null, loading: false, error: errorMsg };
    }
  }, []);
};

// Feature: Core | Why: Handles DOM map analysis — picks current task, calls cloud, executes actions
// Enhanced with web-ui-1 patterns: heuristic injection, confirmer validation, nav state assessment
import React, { useCallback } from 'react';
import { HeadlessWebViewRef } from '../components/HeadlessWebView';
import { auth } from '../features/auth/firebase-config';
import { TaskItem } from '../features/tasks/types';
import { executeDomAction } from './dom-action.executor';
import type { CursorActions, RemoteActions } from './dom-action.executor';
import { assessNavState } from '../features/agent/agent-heuristics.service';
import { shouldConfirm, confirmAction } from '../features/agent/confirmer.service';
import { HeuristicContext } from './useAgentHeuristics';
import { getCurrentNonMissionTask, buildDefaultHeuristicPrompt, applyLoginGate, resolveFirstStep } from './dom-decision.utils';

export const useDomDecision = (activePrompt: string, activeUrl: string, retryCount: number, updateTask: (id: string, s: string, d?: string) => void, workflowIds: string[], webViewRef: React.RefObject<HeadlessWebViewRef>, setActiveUrl: (url: string) => void, navigateActiveTab: (url: string) => Promise<void>, setBlockedReason: (r: string) => void, setIsBlockedModalVisible: (v: boolean) => void, setStatusMessage: (m: string) => void, setIsPaused: (p: boolean) => void, lookedUpDocs: unknown[], setInteractiveRequest: (req: unknown) => void, setIsInteractiveModalVisible: (v: boolean) => void, isThinking: boolean, setIsThinking: (t: boolean) => void, PROXY_BASE_URL: string, isScholarMode: boolean = false, tasks: TaskItem[] = [], onScanComplete?: () => void, getHeuristicContext?: (currentAction: string, currentUrl: string, domNodeCount: number, pageText?: string) => HeuristicContext, onStepOutcome?: (success: boolean) => void, cursorActions?: CursorActions, remoteActions?: RemoteActions, runtimeGeminiApiKey?: string) => {
    const handleDomMapReceived = useCallback(async (map: unknown) => {
        if (!activePrompt || isThinking) return;
        const emptyMap = !map || (Array.isArray(map) ? (map as unknown[]).length === 0 : Object.keys(map as object).length === 0);
        if (!activeUrl || activeUrl === 'about:blank' || emptyMap) return;
        setIsThinking(true);
        const currentTask = getCurrentNonMissionTask(tasks);
        if (currentTask && currentTask.status === 'pending') updateTask(currentTask.id, 'in_progress', `Executing: ${currentTask.title}`);
        const taskContext = currentTask ? { taskId: currentTask.id, taskTitle: currentTask.title, subActions: currentTask.subActions } : undefined;
        const domNodeCount = Array.isArray(map) ? (map as unknown[]).length : Object.keys(map as object).length;
        const navState = assessNavState(activeUrl, domNodeCount);
        if (navState === 'lost') { setStatusMessage('⚠️ Lost — blank page'); setIsThinking(false); return; }
        const heuristicCtx = getHeuristicContext?.('scan_dom', activeUrl, domNodeCount, currentTask?.title);
        const heuristicInjection = heuristicCtx?.promptInjection || buildDefaultHeuristicPrompt(navState);
        setStatusMessage(currentTask ? `Working: ${currentTask.title}` : 'Thinking (Cloud)...');
        try {
            const token = await auth.currentUser?.getIdToken();
            const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token || 'anonymous'}` };
            if (runtimeGeminiApiKey) headers['x-gemini-api-key'] = runtimeGeminiApiKey;
            const cloudResponse = await fetch(`${PROXY_BASE_URL}/agent/analyze`, { method: 'POST', headers, body: JSON.stringify({ prompt: activePrompt + heuristicInjection, url: activeUrl, domMap: map, retryCount, lookedUpDocs, isScholarMode, workflowIds, currentTask: taskContext }) });
            if (!cloudResponse.ok) throw new Error(`Cloud Analysis Failed: ${cloudResponse.status}`);
            const decision = await cloudResponse.json();
            if (applyLoginGate(decision, setStatusMessage, setIsPaused, setBlockedReason, setIsBlockedModalVisible)) { setIsThinking(false); return; }
            if (decision.execution) {
                const firstStep = resolveFirstStep(decision);
                if (!firstStep) { if (currentTask) updateTask(currentTask.id, 'completed', 'Completed — no actions needed'); return; }
                if (shouldConfirm((firstStep as unknown & { action?: string })?.action)) {
                    const confirmation = await confirmAction((firstStep as unknown & { action?: string })?.action || '', (firstStep as unknown & { explanation?: string })?.explanation || '', activePrompt, activeUrl, 'fast');
                    if (!confirmation.confirmed) { setStatusMessage(`⚠️ Confirmer rejected: ${confirmation.reason}`); onStepOutcome?.(false); if (currentTask) updateTask(currentTask.id, 'failed', `Rejected: ${confirmation.reason}`); return; }
                }
                const actionCtx = { activePrompt, activeUrl, webViewRef, setActiveUrl, navigateActiveTab, setStatusMessage, setIsPaused, setBlockedReason, setIsBlockedModalVisible, setInteractiveRequest, setIsInteractiveModalVisible, cursorActions, remoteActions };
                const actionExecuted = await executeDomAction(firstStep, actionCtx);
                if (currentTask && (actionExecuted || (firstStep as unknown & { action?: string })?.action === 'done')) { updateTask(currentTask.id, 'completed', `Done: ${(firstStep as unknown & { action?: string })?.action}${(firstStep as unknown & { targetId?: string })?.targetId ? ` → ${(firstStep as unknown & { targetId?: string })?.targetId}` : ''}`); onStepOutcome?.(true); } else if (currentTask && !actionExecuted) { updateTask(currentTask.id, 'in_progress', `Retrying: ${currentTask.title}`); }
            }
        } catch (err: unknown) { setStatusMessage(`Error: ${(err as Error)?.message || 'Unknown error'}`); } finally { setIsThinking(false); }
    }, [activePrompt, activeUrl, retryCount, isThinking, setIsThinking, tasks, updateTask, setStatusMessage, setBlockedReason, setIsBlockedModalVisible, setIsPaused, setInteractiveRequest, setIsInteractiveModalVisible, webViewRef, setActiveUrl, navigateActiveTab, cursorActions, remoteActions, PROXY_BASE_URL, isScholarMode, workflowIds, lookedUpDocs, runtimeGeminiApiKey, onStepOutcome, getHeuristicContext]);
    return { handleDomMapReceived };
};
                    // Why: avoid infinite in_progress hangs when the planner returns a step
                    // that cannot execute in the current runtime (missing selector/unsupported action).
                    const waitingForUser = firstStep.action === 'wait_for_user' || firstStep.action === 'ask_user';
                    if (!waitingForUser) {
                        updateTask(currentTask.id, 'failed', `No executable action: ${firstStep.action}`);
                        onStepOutcome?.(false);
                    }
                }
            } else if (currentTask) updateTask(currentTask.id, 'completed', 'Completed — analyzed page');
        } catch (e) {
            console.error('Decision failure', e);
            setStatusMessage('Retry required');
            onStepOutcome?.(false);
            if (currentTask) updateTask(currentTask.id, 'failed', `Error: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
            setIsThinking(false);
            onScanComplete?.();
        }
    }, [activePrompt, activeUrl, retryCount, setStatusMessage, setIsPaused, setBlockedReason, setIsBlockedModalVisible, PROXY_BASE_URL, lookedUpDocs, isScholarMode, webViewRef, isThinking, setIsThinking, workflowIds, tasks, updateTask, onScanComplete, getHeuristicContext, cursorActions]);

    return { handleDomMapReceived };
};

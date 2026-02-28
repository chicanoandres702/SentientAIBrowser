// Feature: Core | Why: Handles DOM map analysis — picks current task, calls cloud, executes actions
// Enhanced with web-ui-1 patterns: heuristic injection, confirmer validation, nav state assessment
import React, { useCallback } from 'react';
import { HeadlessWebViewRef } from '../components/HeadlessWebView';
import { auth } from '../features/auth/firebase-config';
import { TaskItem } from '../features/tasks/types';
import { executeDomAction } from './dom-action.executor';
import type { CursorActions, RemoteActions } from './dom-action.executor';
import { assessNavState, buildHeuristicInjection } from '../features/agent/agent-heuristics.service';
import { shouldConfirm, confirmAction } from '../features/agent/confirmer.service';
import { HeuristicContext } from './useAgentHeuristics';

export const useDomDecision = (
    activePrompt: string,
    activeUrl: string,
    retryCount: number,
    setRetryCount: (n: number) => void,
    updateTask: (id: string, s: any, d?: string) => void,
    workflowIds: string[],
    webViewRef: React.RefObject<HeadlessWebViewRef>,
    setActiveUrl: (url: string) => void,
    navigateActiveTab: (url: string) => Promise<void>,
    setBlockedReason: (r: string) => void,
    setIsBlockedModalVisible: (v: boolean) => void,
    setStatusMessage: (m: string) => void,
    setIsPaused: (p: boolean) => void,
    lookedUpDocs: any[],
    setLookedUpDocs: (docs: any[]) => void,
    setInteractiveRequest: (req: { question: string; type: 'confirm' | 'input' } | null) => void,
    setIsInteractiveModalVisible: (v: boolean) => void,
    isThinking: boolean,
    setIsThinking: (t: boolean) => void,
    PROXY_BASE_URL: string,
    isScholarMode: boolean = false,
    tasks: TaskItem[] = [],
    onScanComplete?: () => void,
    heuristicCtx?: HeuristicContext,
    onStepOutcome?: (success: boolean) => void,
    cursorActions?: CursorActions,
    remoteActions?: RemoteActions,
) => {
    /** Find the current task to execute: first in_progress, or first pending non-mission task */
    const getCurrentTask = useCallback((): TaskItem | null => {
        const inProgress = tasks.find(t => !t.isMission && t.status === 'in_progress');
        if (inProgress) return inProgress;
        return tasks.find(t => !t.isMission && t.status === 'pending') || null;
    }, [tasks]);

    const handleDomMapReceived = useCallback(async (map: any) => {
        if (!activePrompt || isThinking) return;

        // Navigation guard — skip expensive LLM on blank/error pages or empty DOM (web-ui-1 pattern)
        const emptyMap = !map || (Array.isArray(map) ? map.length === 0 : Object.keys(map).length === 0);
        if (!activeUrl || activeUrl === 'about:blank' || emptyMap) return;

        setIsThinking(true);

        const currentTask = getCurrentTask();
        if (currentTask && currentTask.status === 'pending') {
            updateTask(currentTask.id, 'in_progress', `Executing: ${currentTask.title}`);
        }

        const taskContext = currentTask
            ? { taskId: currentTask.id, taskTitle: currentTask.title, subActions: currentTask.subActions }
            : undefined;

        // Heuristic: assess navigation state before LLM call (web-ui-1 pattern)
        const domNodeCount = Array.isArray(map) ? map.length : Object.keys(map).length;
        const navState = assessNavState(activeUrl, domNodeCount);
        if (navState === 'lost') { setStatusMessage('⚠️ Lost — blank page'); setIsThinking(false); return; }

        const heuristicInjection = heuristicCtx?.promptInjection || buildHeuristicInjection({ consecutiveFailures: 0, successStreak: 0, lastActionUrl: '', lastAction: '', repeatCount: 0, stuckDetected: false, progressRegex: /(?:question|step|page)\s+(\d+)\s*(?:of|\/)\s*(\d+)/i }, navState);
        setStatusMessage(currentTask ? `Working: ${currentTask.title}` : 'Thinking (Cloud)...');

        try {
            const token = await auth.currentUser?.getIdToken();
            const cloudResponse = await fetch(`${PROXY_BASE_URL}/agent/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token || 'anonymous'}` },
                body: JSON.stringify({ prompt: activePrompt + heuristicInjection, url: activeUrl, domMap: map, retryCount, lookedUpDocs, isScholarMode, workflowIds, currentTask: taskContext }),
            });

            if (!cloudResponse.ok) throw new Error(`Cloud Analysis Failed: ${cloudResponse.status}`);
            const decision = await cloudResponse.json();

            if (decision.isLoginPage) {
                setStatusMessage('Auth Required');
                setIsPaused(true);
                setBlockedReason(decision.blockedReason || 'A security wall (Login) has been detected.');
                setIsBlockedModalVisible(true);
                setIsThinking(false);
                return;
            }

            if (decision.execution) {
                const firstStep = decision.execution.segments?.[0]?.steps?.[0];
                if (!firstStep) {
                    if (currentTask) updateTask(currentTask.id, 'completed', 'Completed — no actions needed');
                    return;
                }

                // Confirmer validation — web-ui-1 pattern: verify before executing risky actions
                if (shouldConfirm(firstStep.action)) {
                    const confirmation = await confirmAction(firstStep.action, firstStep.explanation || '', activePrompt, activeUrl, 'fast');
                    if (!confirmation.confirmed) {
                        setStatusMessage(`⚠️ Confirmer rejected: ${confirmation.reason}`);
                        onStepOutcome?.(false);
                        if (currentTask) updateTask(currentTask.id, 'failed', `Rejected: ${confirmation.reason}`);
                        return;
                    }
                }

                const actionCtx = { activePrompt, activeUrl, webViewRef, setActiveUrl, navigateActiveTab, setStatusMessage, setIsPaused, setBlockedReason, setIsBlockedModalVisible, setInteractiveRequest, setIsInteractiveModalVisible, cursorActions, remoteActions };
                const actionExecuted = await executeDomAction(firstStep, actionCtx);

                if (currentTask && (actionExecuted || firstStep.action === 'done')) {
                    updateTask(currentTask.id, 'completed', `Done: ${firstStep.action}${firstStep.targetId ? ` → ${firstStep.targetId}` : ''}`);
                    onStepOutcome?.(true);
                }
            } else {
                if (currentTask) updateTask(currentTask.id, 'completed', 'Completed — analyzed page');
            }
        } catch (e) {
            console.error('Decision failure', e);
            setStatusMessage('Retry required');
            onStepOutcome?.(false);
            if (currentTask) updateTask(currentTask.id, 'failed', `Error: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
            setIsThinking(false);
            onScanComplete?.();
        }
    }, [activePrompt, activeUrl, retryCount, setStatusMessage, setIsPaused, setBlockedReason, setIsBlockedModalVisible, PROXY_BASE_URL, lookedUpDocs, isScholarMode, webViewRef, isThinking, setIsThinking, workflowIds, tasks, getCurrentTask, updateTask, onScanComplete, cursorActions]);

    return { handleDomMapReceived };
};

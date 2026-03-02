// Feature: Core | Why: Handles DOM map analysis — picks current task, calls cloud, executes actions
// Enhanced with web-ui-1 patterns: heuristic injection, confirmer validation, nav state assessment
import React, { useCallback, useEffect, useRef } from 'react';
import { HeadlessWebViewRef } from '../features/browser';
import { TaskItem } from '../features/tasks/types';
import type { CursorActions, RemoteActions, ActionContext } from './dom-action.executor';
import { assessNavState } from '../features/agent/agent-heuristics.service';
import { HeuristicContext } from './useAgentHeuristics';
import { getCurrentNonMissionTask, buildDefaultHeuristicPrompt } from './dom-decision.utils';
import { runCloudDecision } from './dom-decision.cloud';

// Why: skip LLM execution on pages that require human interaction (2FA, CAPTCHA, auth)
const TFA_PATTERNS = ['/mfa', '/2fa', '/two-factor', '/otp', '/verify', '/challenge', '/checkpoint', 'totp', 'step-up', '/signin/v2/challenge'];

export const useDomDecision = (
    activePrompt: string,
    activeUrl: string,
    retryCount: number,
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
    setInteractiveRequest: (req: { question: string; type: 'confirm' | 'input' } | null) => void,
    setIsInteractiveModalVisible: (v: boolean) => void,
    isThinking: boolean,
    setIsThinking: (t: boolean) => void,
    PROXY_BASE_URL: string,
    isScholarMode: boolean = false,
    tasks: TaskItem[] = [],
    onScanComplete?: () => void,
    getHeuristicContext?: (currentAction: string, currentUrl: string, domNodeCount: number, pageText?: string) => HeuristicContext,
    onStepOutcome?: (success: boolean) => void,
    cursorActions?: CursorActions,
    remoteActions?: RemoteActions,
    runtimeGeminiApiKey?: string,
    isPaused: boolean = false,
) => {
    // Why: useRef keeps live isPaused value accessible inside stale async closures.
    // React state does not propagate into already-running async functions. The ref is
    // the ONLY reliable way to stop in-flight fetch + action execution when user pauses.
    const pauseRef = useRef(isPaused);
    pauseRef.current = isPaused;

    // Why: AbortController cancels the in-flight fetch immediately on pause,
    // so the thinking spinner clears instantly rather than waiting for the request to land.
    const abortCtrlRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (isPaused) {
            abortCtrlRef.current?.abort();
            setIsThinking(false);
        }
    // setIsThinking is stable; isPaused drives abort
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPaused]);
    const handleDomMapReceived = useCallback(async (map: any) => {
        // Why: pauseRef not isPaused — closure captures stale boolean, ref is always live
        if (!activePrompt || isThinking || pauseRef.current) {
            console.debug(`[DomDecision] ⏸️  skip map — noPrompt=${!activePrompt} thinking=${isThinking} paused=${pauseRef.current}`);
            return;
        }

        // Navigation guard — skip expensive LLM on blank/error pages or empty DOM (web-ui-1 pattern)
        const emptyMap = !map || (Array.isArray(map) ? map.length === 0 : Object.keys(map).length === 0);
        if (!activeUrl || activeUrl === 'about:blank' || emptyMap) {
            console.debug(`[DomDecision] ⏸️  skip — blank url or empty map (nodes=${Array.isArray(map) ? map.length : 0})`);
            return;
        }

        // Why: 2FA pages need user action — hold LLM until the user completes verification
        if (TFA_PATTERNS.some(p => activeUrl.toLowerCase().includes(p))) {
            console.debug(`[DomDecision] ⚠️  2FA/auth page detected — parking url=${activeUrl}`);
            setStatusMessage('⏳ Waiting for user verification (2FA/auth challenge)...');
            return;
        }

        const domNodeCount = Array.isArray(map) ? map.length : Object.keys(map).length;
        console.log(`[DomDecision] 📊 map received nodes=${domNodeCount} url=${activeUrl} task=${tasks.find(t => t.status==='in_progress' || t.status==='pending')?.title?.substring(0,40) ?? 'none'}`);
        setIsThinking(true);
        // Why: second check after sync state settle — user may have paused between scan
        // trigger queuing and the callback actually executing
        if (pauseRef.current) { console.debug('[DomDecision] ⏸️  paused after setIsThinking — aborting'); setIsThinking(false); return; }

        abortCtrlRef.current = new AbortController();

        const currentTask = getCurrentNonMissionTask(tasks);
        if (currentTask && currentTask.status === 'pending') updateTask(currentTask.id, 'in_progress', `Executing: ${currentTask.title}`);

        const taskContext = currentTask
            ? { taskId: currentTask.id, taskTitle: currentTask.title, subActions: currentTask.subActions }
            : undefined;

        // Heuristic: assess navigation state before LLM call (web-ui-1 pattern)
        const navState = assessNavState(activeUrl, domNodeCount);
        if (navState === 'lost') { console.warn(`[DomDecision] ⚠️  navState=lost nodes=${domNodeCount}`); setStatusMessage('⚠️ Lost — blank page'); setIsThinking(false); return; }
        console.debug(`[DomDecision] 🧭 navState=${navState} nodes=${domNodeCount}`);

        const heuristicCtx = getHeuristicContext?.(
            'scan_dom',
            activeUrl,
            domNodeCount,
            currentTask?.title,
        );
        const heuristicInjection = heuristicCtx?.promptInjection || buildDefaultHeuristicPrompt(navState);
        setStatusMessage(currentTask ? `Working: ${currentTask.title}` : 'Thinking (Cloud)...');

        const actionCtx: ActionContext = { activePrompt, activeUrl, webViewRef, setActiveUrl, navigateActiveTab, setStatusMessage, setIsPaused, setBlockedReason, setIsBlockedModalVisible, setInteractiveRequest, setIsInteractiveModalVisible, cursorActions, remoteActions, isPausedRef: pauseRef };
        await runCloudDecision({ PROXY_BASE_URL, runtimeGeminiApiKey, activePrompt, heuristicInjection, activeUrl, map, retryCount, lookedUpDocs, isScholarMode, workflowIds, taskContext, currentTask, actionCtx, setStatusMessage, setIsPaused, setBlockedReason, setIsBlockedModalVisible, updateTask, setIsThinking, onStepOutcome, onScanComplete, pauseRef, abortSignal: abortCtrlRef.current?.signal });
    }, [activePrompt, activeUrl, retryCount, setStatusMessage, setIsPaused, setBlockedReason, setIsBlockedModalVisible, PROXY_BASE_URL, lookedUpDocs, isScholarMode, webViewRef, isThinking, setIsThinking, workflowIds, tasks, updateTask, onScanComplete, getHeuristicContext, cursorActions]);

    return { handleDomMapReceived };
};

// Feature: Core | Why: Cloud agent call + decision execution — isolated from useDomDecision
import { auth } from '../features/auth/firebase-config';
import { executeDomAction } from './dom-action.executor';
import type { ActionContext } from './dom-action.executor';
import { applyLoginGate, resolveFirstStep } from './dom-decision.utils';
import { shouldConfirm, confirmAction } from '../features/agent/confirmer.service';

export interface CloudDecisionArgs {
    PROXY_BASE_URL: string;
    runtimeGeminiApiKey?: string;
    activePrompt: string;
    heuristicInjection: string;
    activeUrl: string;
    map: any;
    retryCount: number;
    lookedUpDocs: any[];
    isScholarMode: boolean;
    workflowIds: string[];
    taskContext: any;
    currentTask: any;
    actionCtx: ActionContext;
    setStatusMessage: (m: string) => void;
    setIsPaused: (v: boolean) => void;
    setBlockedReason: (r: string) => void;
    setIsBlockedModalVisible: (v: boolean) => void;
    updateTask: (id: string, s: any, d?: string) => void;
    setIsThinking: (t: boolean) => void;
    onStepOutcome?: (success: boolean) => void;
    onScanComplete?: () => void;
    // Why: live ref + abort signal let pause stop in-flight execution immediately
    pauseRef?: { current: boolean };
    abortSignal?: AbortSignal;
}

export const runCloudDecision = async (args: CloudDecisionArgs): Promise<void> => {
    const { PROXY_BASE_URL, runtimeGeminiApiKey, activePrompt, heuristicInjection, activeUrl, map,
        retryCount, lookedUpDocs, isScholarMode, workflowIds, taskContext, currentTask, actionCtx,
        setStatusMessage, setIsPaused, setBlockedReason, setIsBlockedModalVisible,
        updateTask, setIsThinking, onStepOutcome, onScanComplete, pauseRef, abortSignal } = args;
    // Why: guard at entry — user may have paused between scan and cloud call starting
    if (pauseRef?.current) { console.debug('[CloudDecision] ⏸️  skip — paused at entry'); setIsThinking(false); return; }
    const domNodeCount = Array.isArray(map) ? map.length : Object.keys(map ?? {}).length;
    console.log(`[CloudDecision] 🚀 fetch url=${activeUrl} nodes=${domNodeCount} task=${currentTask?.id ?? 'none'} retry=${retryCount}`);
    try {
        const token = await auth.currentUser?.getIdToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token || 'anonymous'}` };
        if (runtimeGeminiApiKey) headers['x-gemini-api-key'] = runtimeGeminiApiKey;
        const fetchStart = Date.now();
        const res = await fetch(`${PROXY_BASE_URL}/agent/analyze`, {
            method: 'POST', headers, signal: abortSignal,
            body: JSON.stringify({ prompt: activePrompt + heuristicInjection, url: activeUrl, domMap: map, retryCount, lookedUpDocs, isScholarMode, workflowIds, currentTask: taskContext }),
        });
        if (!res.ok) throw new Error(`Cloud Analysis Failed: ${res.status}`);
        const decision = await res.json();
        console.log(`[CloudDecision] ✅ response ${res.status} in ${Date.now() - fetchStart}ms action=${decision?.execution?.action ?? decision?.action ?? 'none'} hasExecution=${!!decision.execution}`);
        // Why: check AFTER the await — user may have paused while fetch was in flight
        if (pauseRef?.current) { console.debug('[CloudDecision] ⏸️  paused after fetch — aborting'); setStatusMessage('Paused'); setIsThinking(false); return; }
        // Why: only apply the login gate when the LLM has NO execution plan.
        // If decision.execution is also present, the LLM already knows what to do on this
        // page (e.g. fill credentials, click sign in) — pausing would break that flow.
        // We only hard-stop when isLoginPage:true + no plan, meaning human MFA/CAPTCHA needed.
        const isLoginBlock = decision?.isLoginPage && !decision.execution;
        if (isLoginBlock && applyLoginGate(decision, setStatusMessage, setIsPaused, setBlockedReason, setIsBlockedModalVisible)) {
            // Why: reaching an auth wall IS the successful outcome of a navigate task.
            if (currentTask) {
                const isNavTask =
                    currentTask.title.toLowerCase().includes('navigate') ||
                    currentTask.subActions?.some(sa => sa.action === 'navigate' || sa.action === 'open_url');
                if (isNavTask) {
                    updateTask(currentTask.id, 'completed', 'Navigation completed — reached login page');
                }
            }
            setIsThinking(false);
            return;
        }
        if (decision.execution) {
            const firstStep = resolveFirstStep(decision);
            if (!firstStep) { if (currentTask) updateTask(currentTask.id, 'completed', 'Completed — no actions needed'); return; }
            console.log(`[CloudDecision] 🔧 firstStep action=${firstStep.action} targetId=${firstStep.targetId ?? '-'} value=${String(firstStep.value ?? '').substring(0, 60)}`);
            if (shouldConfirm(firstStep.action)) {
                const conf = await confirmAction(firstStep.action, firstStep.explanation || '', activePrompt, activeUrl, 'fast');
                console.log(`[CloudDecision] 🛡️  confirmer confirmed=${conf.confirmed} reason=${conf.reason ?? '-'}`);
                if (!conf.confirmed) {
                    setStatusMessage(`⚠️ Confirmer rejected: ${conf.reason}`);
                    onStepOutcome?.(false);
                    if (currentTask) updateTask(currentTask.id, 'failed', `Rejected: ${conf.reason}`);
                    return;
                }
            }
            const actionExecuted = await executeDomAction(firstStep, actionCtx);
            console.log(`[CloudDecision] 🎯 executeDomAction executed=${actionExecuted} action=${firstStep.action}`);
            if (currentTask && (actionExecuted || firstStep.action === 'done')) {
                updateTask(currentTask.id, 'completed', `Done: ${firstStep.action}${firstStep.targetId ? ` → ${firstStep.targetId}` : ''}`);
                onStepOutcome?.(true);
            } else if (currentTask && !actionExecuted) {
                const waiting = firstStep.action === 'wait_for_user' || firstStep.action === 'ask_user';
                if (!waiting) { updateTask(currentTask.id, 'failed', `No executable action: ${firstStep.action}`); onStepOutcome?.(false); }
            }
        } else if (currentTask) updateTask(currentTask.id, 'completed', 'Completed — analyzed page');
    } catch (e) {
        // Why: AbortError = intentional pause, not a failure — suppress error UI
        if (e instanceof Error && e.name === 'AbortError') {
            console.debug('[CloudDecision] ⏸️  fetch aborted (user paused)');
            setStatusMessage('Paused');
            return;
        }
        console.error('[CloudDecision] ❌ decision failure url=' + activeUrl, e);
        setStatusMessage('Retry required');
        onStepOutcome?.(false);
        if (currentTask) updateTask(currentTask.id, 'failed', `Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally { setIsThinking(false); onScanComplete?.(); }
};

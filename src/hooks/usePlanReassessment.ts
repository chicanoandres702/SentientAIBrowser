// Feature: Planning | Why: After every task set completes, re-plan and immediately drive execution
// Pattern: browser-use TaskManager — plan → structured segments → triggerScan to execute immediately
import { useCallback, useRef } from 'react';
import { auth } from '../features/auth/firebase-config';
import { TaskItem, TaskStatus, SubAction } from '../features/tasks/types';

interface ReassessConfig {
    activePrompt: string;
    activeUrl: string;
    tasks: TaskItem[];
    PROXY_BASE_URL: string;
    tabId: string;
    addTask: (title: string, status: TaskStatus, details?: string, extra?: Partial<TaskItem>) => Promise<any>;
    updateTask?: (id: string, status: TaskStatus, details?: string) => void;
    removeTask?: (id: string) => void;
    setStatusMessage: (msg: string) => void;
    /** Called after new tasks are queued — triggers an immediate DOM scan instead of waiting 10s */
    triggerScan?: () => void;
}

/**
 * Returns a callable `reassess` that re-invokes the planner when all standalone tasks finish,
 * creates structured segment tasks with subActions, purges stale pending tasks, then
 * calls triggerScan() so execution begins immediately (browser-use core loop pattern).
 * Guards: 5s throttle, isReassessing mutex, no active blocking tasks.
 */
export const usePlanReassessment = ({
    activePrompt, activeUrl, tasks, PROXY_BASE_URL, tabId,
    addTask, removeTask, setStatusMessage, triggerScan,
}: ReassessConfig) => {
    const lastReassessRef = useRef(0);
    const isReassessingRef = useRef(false);

    const reassess = useCallback(async () => {
        if (!activePrompt || !PROXY_BASE_URL) { console.debug('[Reassess] skip — no prompt or proxy URL'); return; }
        if (isReassessingRef.current) { console.debug('[Reassess] ⏳ skip — already reassessing'); return; }
        if (Date.now() - lastReassessRef.current < 5000) { console.debug('[Reassess] ⏳ throttled'); return; }

        // Only re-plan when ALL non-mission tasks are done
        const standalone = tasks.filter(t => !t.isMission && !t.missionId);
        const blocking = standalone.filter(t => t.status === 'pending' || t.status === 'in_progress');
        if (standalone.length > 0 && blocking.length > 0) {
            console.debug(`[Reassess] ⏸️  skip — ${blocking.length}/${standalone.length} standalone tasks active`);
            return;
        }

        isReassessingRef.current = true;
        lastReassessRef.current = Date.now();
        setStatusMessage('🔄 Planning next steps...');
        try {
            const token = await auth.currentUser?.getIdToken();
            // Why: completed task history prevents the LLM from re-planning steps that already
            // finished — especially navigations that redirected (e.g. campus.capella.edu →
            // login.microsoftonline.com). Without this, the planner sees the redirect URL,
            // doesn't know the navigate was done, and queues it again indefinitely.
            const completedTitles = standalone
                .filter(t => t.status === 'completed')
                .map(t => t.title);
            const planPrompt = completedTitles.length > 0
                ? `${activePrompt}\n\n[Already completed — do NOT repeat these steps]: ${completedTitles.join(' | ')}`
                : activePrompt;
            const res = await fetch(`${PROXY_BASE_URL}/agent/plan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token || ''}` },
                body: JSON.stringify({ prompt: planPrompt, tabId, url: activeUrl }),
            });
            if (!res.ok) { console.warn(`[Reassess] ❌ plan failed status=${res.status}`); setStatusMessage('Ready'); return; }
            const { missionResponse } = await res.json();
            const segments: Array<{ name: string; steps: any[] }> = missionResponse?.execution?.segments ?? [];
            console.log(`[Reassess] 📋 plan returned ${segments.length} segment(s)`);
            if (segments.length === 0) { setStatusMessage('✅ All steps complete'); return; }

            // Purge stale pending tasks before adding freshly planned ones
            const stale = standalone.filter(t => t.status === 'pending');
            for (const pt of stale) removeTask?.(pt.id);

            // Add structured segment tasks with subActions (browser-use TaskManager pattern)
            let firstAdded = false;
            for (const seg of segments) {
                const segName = seg.name || 'Next step';
                const steps = seg.steps ?? [];
                // Why: normalize titles by stripping leading action-verb prefixes so
                // 'navigate: go to campus.capella.edu' matches plan segment 'Go to campus.capella.edu'.
                // Also catches redirect cases where the COMPLETED task URL is a prefix of the new segment.
                const norm = (s: string) => s.toLowerCase().replace(/^[\w_]+:\s*/i, '').trim();
                const segNorm = norm(segName);
                const alreadyDone = tasks.some(t =>
                    t.status === 'completed' && (
                        norm(t.title) === segNorm ||
                        norm(t.title).includes(segNorm) ||
                        segNorm.includes(norm(t.title))
                    )
                );
                if (alreadyDone) continue;

                const subActions: SubAction[] = steps.map((s: any) => ({
                    action: s.action || 'interact',
                    goal: s.goal || segName,
                    explanation: s.explanation || s.action || '',
                    status: 'pending' as TaskStatus,
                }));

                // First new segment is immediately in_progress to start execution
                const status: TaskStatus = !firstAdded ? 'in_progress' : 'pending';
                firstAdded = true;
                await addTask(segName, status, `${steps.length} action(s)`, {
                    subActions,
                    estimatedDuration: steps.length * 15000,
                    startTime: status === 'in_progress' ? Date.now() : undefined,
                });
            }
            setStatusMessage(`📋 Reassessed — ${segments.length} step(s) queued`);
            // Drive execution immediately — don't wait for the 10s scanner interval
            triggerScan?.();
        } catch (e) {
            console.error('[Reassess] ❌ error', e);
            setStatusMessage('Ready');
        } finally {
            isReassessingRef.current = false;
        }
    }, [activePrompt, activeUrl, tasks, PROXY_BASE_URL, tabId, addTask, removeTask, setStatusMessage, triggerScan]);

    return { reassess };
};

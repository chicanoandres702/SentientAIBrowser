// Feature: Planning | Why: After every DOM scan, reassess the mission plan and update the task queue
import { useRef, useCallback } from 'react';
import { auth } from '../features/auth/firebase-config';
import { TaskItem, TaskStatus } from '../features/tasks/types';
import { getSchemaPayload } from '../utils/schema-context';
import { generateMockPlanResponse } from '../utils/prompt-planner';
import { mergeReassessedTasks } from './reassess-merge.strategy';

interface ReassessConfig {
    activePrompt: string;
    activeUrl: string;
    tasks: TaskItem[];
    PROXY_BASE_URL: string;
    tabId: string;
    addTask: (title: string, status: TaskStatus, details?: string, extra?: Partial<TaskItem>) => Promise<any>;
    updateTask: (id: string, status: TaskStatus, details?: string) => void;
    removeTask: (id: string) => void;
    setStatusMessage: (msg: string) => void;
}

/**
 * Returns a callable `reassess` function that re-invokes the planner
 * to update the task queue after every DOM scan.
 * Guards: active mission, 3s throttle, not already reassessing.
 */
export const usePlanReassessment = ({
    activePrompt, activeUrl, tasks, PROXY_BASE_URL, tabId,
    addTask, updateTask, removeTask, setStatusMessage,
}: ReassessConfig) => {
    const lastReassessRef = useRef<number>(0);
    const reassessingRef = useRef<boolean>(false);

    const reassess = useCallback(async () => {
        if (reassessingRef.current) return;
        if (Date.now() - lastReassessRef.current < 3000) return;

        const mission = tasks.find(t => t.isMission && (t.status === 'in_progress' || t.status === 'pending'));
        if (!mission || !activePrompt) return;

        const missionId = mission.id;
        const childTasks = tasks.filter(t => !t.isMission && t.missionId === missionId);
        const pendingTasks = childTasks.filter(t => t.status === 'pending');
        const completedTasks = childTasks.filter(t => t.status === 'completed');
        if (pendingTasks.length === 0) return;

        reassessingRef.current = true;
        lastReassessRef.current = Date.now();
        setStatusMessage('🔄 Reassessing plan...');

        try {
            const completedSummary = completedTasks.map(t => t.title).join(', ') || 'none';
            const currentSummary = childTasks.find(t => t.status === 'in_progress')?.title || 'none';
            const reassessPrompt = [
                `ORIGINAL GOAL: ${activePrompt}`, `CURRENT URL: ${activeUrl}`,
                `COMPLETED: ${completedSummary}`, `ACTIVE: ${currentSummary}`,
                `REMAINING: ${pendingTasks.map(t => t.title).join(', ')}`,
                '', 'Re-evaluate remaining tasks after a DOM scan. Keep completed tasks, update PENDING only.',
            ].join('\n');

            let newResponse: any = null;
            try {
                const token = await auth.currentUser?.getIdToken();
                const resp = await fetch(`${PROXY_BASE_URL}/agent/plan`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token || 'anonymous'}` },
                    body: JSON.stringify({ prompt: reassessPrompt, tabId, ...getSchemaPayload() }),
                });
                if (resp.ok) { const d = await resp.json(); newResponse = d.missionResponse || d; }
            } catch { newResponse = generateMockPlanResponse(reassessPrompt).missionResponse; }

            if (!newResponse?.execution?.segments) { setStatusMessage('Reassessment: no changes'); return; }

            const count = await mergeReassessedTasks(
                newResponse.execution.segments, pendingTasks, completedTasks, childTasks, missionId,
                { addTask, removeTask },
            );
            setStatusMessage(`Plan updated — ${count} tasks`);
        } catch (e) {
            console.error('[Reassess] Failed:', e);
            setStatusMessage('Reassess failed');
        } finally { reassessingRef.current = false; }
    }, [activePrompt, activeUrl, tasks, PROXY_BASE_URL, tabId, addTask, updateTask, removeTask, setStatusMessage]);

    return { reassess };
};

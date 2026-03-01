// Feature: Tasks | Trace: README.md
/*
 * [Parent Feature/Milestone] Tasks
 * [Child Task/Issue] useTaskQueue refactor
 * [Subtask] Hierarchical mission-child task mutations and state advancement
 * [Upstream] Single task update -> [Downstream] Mission progress recalc and sibling auto-advance
 * [Law Check] 89 lines | Passed 100-Line Law
 */
import { useCallback } from 'react';
import { TaskItem, TaskStatus } from '../../features/tasks/types';
import { recalcMissionProgress } from './task-queue-progress';

/** Hook for hierarchical mission/child task mutations and advancement logic */
export const useTaskHierarchy = () => {
    const advanceTaskHierarchy = useCallback((
        updated: TaskItem[],
        taskId: string,
        status: TaskStatus,
        now: number,
        deriveProgress: (s: TaskStatus, sa?: TaskItem['subActions'], c?: number) => number,
        advanceSubActions: (sa?: TaskItem['subActions'], s: TaskStatus, d?: string) => TaskItem['subActions'],
        updateTaskInFirestore: (id: string, updates: Partial<TaskItem>) => Promise<void>,
    ): TaskItem[] => {
        const task = updated.find(t => t.id === taskId);
        if (!task?.missionId) return updated;

        if (status === 'in_progress') {
            const siblingsToDemote = updated.filter(t =>
                !t.isMission && t.missionId === task.missionId && t.id !== taskId && t.status === 'in_progress'
            );
            if (siblingsToDemote.length > 0) {
                siblingsToDemote.forEach(s => {
                    updateTaskInFirestore(s.id, { status: 'pending', details: s.details || `Pending: ${s.title}` }).catch(() => {});
                });
                updated = updated.map(t =>
                    siblingsToDemote.some(s => s.id === t.id)
                        ? { ...t, status: 'pending' as TaskStatus, details: t.details || `Pending: ${t.title}` }
                        : t
                );
            }
        }

        if (task.status === 'completed' || task.status === 'failed') {
            const nextPending = updated.find(t =>
                !t.isMission && t.missionId === task.missionId && t.status === 'pending' && t.id !== taskId
            );
            if (nextPending) {
                const nextSubActions = advanceSubActions(nextPending.subActions, 'in_progress', `Executing: ${nextPending.title}`);
                const nextProgress = deriveProgress('in_progress', nextSubActions, nextPending.progress);
                updated = updated.map(t =>
                    t.id === nextPending.id
                        ? { ...t, status: 'in_progress' as TaskStatus, startTime: now, details: `Executing: ${t.title}`, progress: nextProgress, subActions: nextSubActions }
                        : t
                );
                updateTaskInFirestore(nextPending.id, { status: 'in_progress', details: `Executing: ${nextPending.title}`, progress: nextProgress }).catch(() => {});
            }
        }

        updated = recalcMissionProgress(updated, task.missionId);
        const mission = updated.find(t => t.id === task.missionId);
        if (mission) {
            const done = updated.filter(t => t.missionId === mission.id && !t.isMission && t.status === 'completed').length;
            const total = updated.filter(t => t.missionId === mission.id && !t.isMission).length;
            updateTaskInFirestore(mission.id, { status: mission.status, progress: mission.progress, details: `${done}/${total} tasks done` }).catch(() => {});
        }
        return updated;
    }, []);

    return { advanceTaskHierarchy };
};

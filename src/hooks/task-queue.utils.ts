// Feature: Tasks | Trace: src/hooks/useTaskQueue.ts
// Extract: Task comparison and validation helpers

import { TaskItem } from '../features/tasks/types';

/** Check if two subAction arrays are equivalent (deep comparison) */
export const areSubActionsEqual = (
    a?: TaskItem['subActions'],
    b?: TaskItem['subActions'],
): boolean => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        const aa = a[i];
        const bb = b[i];
        if (aa.action !== bb.action || aa.explanation !== bb.explanation || aa.status !== bb.status)
            return false;
    }
    return true;
};

/** Check if two tasks are equivalent (for change detection) */
export const isTaskEquivalent = (prev: TaskItem, next: TaskItem): boolean => (
    prev.id === next.id
    && prev.title === next.title
    && prev.status === next.status
    && prev.progress === next.progress
    && prev.details === next.details
    && prev.timestamp === next.timestamp
    && prev.startTime === next.startTime
    && prev.completedTime === next.completedTime
    && prev.order === next.order
    && prev.missionId === next.missionId
    && prev.workflowId === next.workflowId
    && prev.workspaceId === next.workspaceId
    && areSubActionsEqual(prev.subActions, next.subActions)
);

/** Derive progress percentage from task status and sub-actions */
export const deriveProgress = (
    status: TaskItem['status'],
    subActions?: TaskItem['subActions'],
    current: number = 0,
): number => {
    if (!subActions || subActions.length === 0) {
        if (status === 'completed') return 100;
        if (status === 'in_progress') return Math.max(current, 50);
        if (status === 'failed') return 0;
        return 0;
    }

    const total = subActions.length;
    const completed = subActions.filter(s => s.status === 'completed').length;
    const failed = subActions.filter(s => s.status === 'failed').length;

    if (failed > 0) return 0;
    if (completed === total) return 100;
    if (status === 'in_progress') return Math.max(Math.round((completed / total) * 100), 10);

    return 0;
};

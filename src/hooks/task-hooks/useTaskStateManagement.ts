// Feature: Tasks | Trace: README.md
/*
 * [Parent Feature/Milestone] Tasks
 * [Child Task/Issue] useTaskQueue refactor
 * [Subtask] State management, equality checks, progress calculation
 * [Upstream] TaskItem type -> [Downstream] setTasks reducer
 * [Law Check] 78 lines | Passed 100-Line Law
 */
import { useState, useCallback } from 'react';
import { TaskItem, TaskStatus } from '../../features/tasks/types';

/** Equality check for task sub-actions to prevent unnecessary re-renders */
export const areSubActionsEqual = (a?: TaskItem['subActions'], b?: TaskItem['subActions']): boolean => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        const aa = a[i];
        const bb = b[i];
        if (aa.action !== bb.action || aa.explanation !== bb.explanation || aa.status !== bb.status) return false;
    }
    return true;
};

/** Shallow equality check for task items */
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
export const deriveProgress = (status: TaskStatus, subActions?: TaskItem['subActions'], current: number = 0): number => {
    if (!subActions || subActions.length === 0) {
        if (status === 'completed') return 100;
        if (status === 'in_progress') return Math.max(current, 50);
        return 0;
    }

    const total = subActions.length;
    const completed = subActions.filter(sa => sa.status === 'completed').length;
    const inProgress = subActions.filter(sa => sa.status === 'in_progress').length;
    const base = Math.round(((completed + inProgress * 0.5) / total) * 100);

    if (status === 'completed') return 100;
    if (status === 'in_progress') return Math.max(base, 5);
    return base;
};

/** Hook for task state management and equality utilities */
export const useTaskStateManagement = () => {
    const [tasks, setTasks] = useState<TaskItem[]>([]);

    const mergeTaskSnapshot = useCallback((cloudTasks: TaskItem[]): TaskItem[] => {
        return tasks.reduce((merged, prevTask) => {
            const cloudTask = cloudTasks.find(ct => ct.id === prevTask.id);
            return [...merged, cloudTask && isTaskEquivalent(prevTask, cloudTask) ? prevTask : cloudTask || prevTask];
        }, [] as TaskItem[]);
    }, [tasks]);

    return { tasks, setTasks, mergeTaskSnapshot, isTaskEquivalent, deriveProgress };
};

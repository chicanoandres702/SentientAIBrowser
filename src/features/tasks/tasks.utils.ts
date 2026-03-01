// Feature: Tasks | Trace: src/features/tasks/tasks.utils.ts
/*
 * [Pure Logic] Task filtering and status utils
 * [Upstream] Types → [Downstream] Service
 * [Law Check] 60 lines | Passed
 */

import { TaskItem, TaskStatus, TaskFilter } from './tasks.types';

export const getCurrentTaskForMission = (tasks: TaskItem[]): TaskItem | null => {
    const inProgress = tasks.find(t => !t.isMission && t.status === 'in_progress');
    if (inProgress) return inProgress;
    return tasks.find(t => !t.isMission && t.status === 'pending') || null;
};

export const filterTasks = (tasks: TaskItem[], filter: TaskFilter): TaskItem[] => {
    let result = tasks;
    if (filter.status) result = result.filter(t => t.status === filter.status);
    if (filter.tabId) result = result.filter(t => t.tabId === filter.tabId);
    if (filter.missionId) result = result.filter(t => t.missionId === filter.missionId);
    return result;
};

export const getTaskStats = (tasks: TaskItem[]) => {
    let active = 0, completed = 0, failed = 0;
    for (const t of tasks) {
        if (t.isMission) continue;
        if (t.status === 'pending' || t.status === 'in_progress') active++;
        else if (t.status === 'completed') completed++;
        else if (t.status === 'failed' || t.status === 'blocked_on_user') failed++;
    }
    return { active, completed, failed };
};

export const updateTaskStatus = (tasks: TaskItem[], taskId: string, status: TaskStatus): TaskItem[] =>
    tasks.map(t => (t.id === taskId ? { ...t, status } : t));

export const sortByStatus = (tasks: TaskItem[]): TaskItem[] => {
    const order: Record<TaskStatus, number> = {
        in_progress: 0,
        pending: 1,
        completed: 2,
        failed: 3,
        blocked_on_user: 4,
    };
    return [...tasks].sort((a, b) => (order[a.status] ?? 5) - (order[b.status] ?? 5));
};

export const groupByMission = (tasks: TaskItem[]): Map<string, TaskItem[]> => {
    const groups = new Map<string, TaskItem[]>();
    for (const task of tasks) {
        if (!groups.has(task.missionId)) groups.set(task.missionId, []);
        groups.get(task.missionId)!.push(task);
    }
    return groups;
};

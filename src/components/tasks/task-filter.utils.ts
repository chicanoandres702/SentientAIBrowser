// Feature: Tasks | Why: Pure filtering/sorting logic separated from UI rendering
import { useMemo } from 'react';
import { TaskItem, TaskStatus } from '../../features/tasks/types';

// Re-export hierarchical logic so existing imports keep working
export { useHierarchicalTasks } from './task-hierarchy.utils';
export type { HierarchyRow, MissionNode } from './task-hierarchy.utils';

export type FilterType = 'all' | 'active' | 'completed' | 'failed';
export type SortMode = 'time' | 'status';

/** Counts tasks by status category — single pass O(n) instead of 4 filter passes */
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

export const STATUS_ORDER: Record<TaskStatus, number> = {
    in_progress: 0,
    pending: 1,
    completed: 2,
    failed: 3,
    blocked_on_user: 4,
};

/** Get the active mission (if any) — NOT included in the task list */
export const useActiveMission = (tasks: TaskItem[]) =>
    useMemo(() =>
        tasks.find(t => t.isMission && t.status !== 'completed' && t.status !== 'failed')
        || tasks.find(t => t.isMission)
        || null,
    [tasks]);

/** Memoized filter + sort for the task list — missions are excluded (shown as header) */
export const useFilteredTasks = (
    tasks: TaskItem[],
    filterType: FilterType,
    sortBy: SortMode,
) =>
    useMemo(() => {
        let filtered = tasks.filter(t => !t.isMission);
        if (filterType === 'active') filtered = filtered.filter(t => t.status === 'pending' || t.status === 'in_progress');
        else if (filterType === 'completed') filtered = filtered.filter(t => t.status === 'completed');
        else if (filterType === 'failed') filtered = filtered.filter(t => t.status === 'failed' || t.status === 'blocked_on_user');

        return sortBy === 'status'
            ? [...filtered].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
            : [...filtered].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    }, [tasks, filterType, sortBy]);

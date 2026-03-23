// Feature: Tasks | Trace: src/hooks/useFilteredTasks.ts
/*
 * [Memoized Hook] Task filtering for UI
 * [Upstream] Features/Tasks → [Downstream] Components
 * [Law Check] 48 lines | Passed
 */
import { useMemo } from 'react';
import { TaskItem, TaskStatus } from '../features/tasks/types';

export type FilterType = 'all' | 'active' | 'completed' | 'failed';
export type SortMode = 'time' | 'status';

const STATUS_ORDER: Record<TaskStatus, number> = {
  in_progress: 0,
  pending: 1,
  completed: 2,
  failed: 3,
  blocked_on_user: 4,
};

/**
 * Memoized filter + sort for task list
 * Excludes missions (shown as header)
 * Why: Prevents unnecessary re-renders when parent re-renders
 */
export const useFilteredTasks = (
  tasks: TaskItem[],
  filterType: FilterType,
  sortBy: SortMode,
) =>
  useMemo(() => {
    let filtered = tasks.filter(t => !t.isMission);
    if (filterType === 'active')
      filtered = filtered.filter(
        t => t.status === 'pending' || t.status === 'in_progress'
      );
    else if (filterType === 'completed')
      filtered = filtered.filter(t => t.status === 'completed');
    else if (filterType === 'failed')
      filtered = filtered.filter(
        t => t.status === 'failed' || t.status === 'blocked_on_user'
      );

    return sortBy === 'status'
      ? [...filtered].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
      : [...filtered].sort((a, b) => {
          if (a.order != null && b.order != null) return a.order - b.order;
          if (a.order != null) return -1;
          if (b.order != null) return 1;
          return (a.timestamp || 0) - (b.timestamp || 0);
        });
  }, [tasks, filterType, sortBy]);

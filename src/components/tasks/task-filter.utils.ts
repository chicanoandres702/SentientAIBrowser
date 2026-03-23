// Feature: Tasks | Trace: src/components/tasks/task-filter.utils.ts (Compatibility layer)
/*
 * [Deprecated] Re-exports for backward compatibility with old imports
 * [New code] Use src/hooks/ or src/features/tasks barrel export
 */
import { useActiveMission as hookActiveMission } from '../../hooks/useActiveMission';
import { useFilteredTasks as hookFilteredTasks, FilterType, SortMode } from '../../hooks/useFilteredTasks';
import { TaskItem, TaskStatus } from '../../features/tasks/types';

// Re-export hierarchical logic so existing imports keep working
export { useHierarchicalTasks } from './task-hierarchy.utils';
export type { HierarchyRow, MissionNode } from './task-hierarchy.utils';

export type { FilterType, SortMode };

/** Counts tasks by status category — single pass O(n) */
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

// Re-export hooks from their new home
export const useActiveMission = hookActiveMission;
export const useFilteredTasks = hookFilteredTasks;

// Feature: Tasks | Trace: README.md
/*
 * [Parent Feature/Milestone] Tasks
 * [Child Task/Issue] Workflow panel logic hook
 * [Subtask] Extracts task filtering, mission detection, and progress calculation
 * [Upstream] tasks array + activeTabId -> [Downstream] Computed UI state
 * [Law Check] 42 lines | Passed 100-Line Law
 */

import { useMemo } from 'react';
import type { TaskItem } from '../../features/tasks/types';
import { useActiveMission, useFilteredTasks } from './task-filter.utils';

export const useWorkflowPanel = (tasks: TaskItem[], activeTabId?: string) => {
  const tabTasks = useMemo(
    () => (activeTabId ? tasks.filter((t) => t.tabId === activeTabId) : tasks),
    [tasks, activeTabId]
  );

  const mission = useActiveMission(tabTasks);
  const allTaskList = useFilteredTasks(tabTasks, 'all', 'time');
  const taskList = useMemo(
    () => (mission ? allTaskList.filter((t) => t.missionId === mission.id) : allTaskList),
    [allTaskList, mission]
  );

  const completedCount = taskList.filter((t) => t.status === 'completed').length;
  const total = taskList.length;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const isActive = tabTasks.some((t) => t.status === 'in_progress');

  return {
    tabTasks,
    mission,
    taskList,
    completedCount,
    total,
    pct,
    isActive,
  };
};

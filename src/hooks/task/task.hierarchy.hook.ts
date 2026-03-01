// Feature: Task | Trace: README.md
/*
 * [Parent Feature/Milestone] Task
 * [Child Task/Issue] Task hierarchy micro-hook
 * [Subtask] Mission/child task relationships, sibling auto-advance
 * [Upstream] Monolithic logic -> [Downstream] Hierarchy management hook
 * [Law Check] 89 lines | Passed 100-Line Law
 */

import { useCallback } from 'react';
import { logger } from '../../features/core/core.logger.service';

export const useTaskHierarchy = (tasks: Record<string, unknown>, setTasks: (t: Record<string, unknown>) => void) => {
  const getMissionTasks = useCallback(
    (missionId: string): unknown[] => {
      return Object.values(tasks).filter((t: any) => t.missionId === missionId);
    },
    [tasks]
  );

  const getChildTasks = useCallback(
    (parentTaskId: string): unknown[] => {
      return Object.values(tasks).filter((t: any) => t.parentTaskId === parentTaskId);
    },
    [tasks]
  );

  const getNextSibling = useCallback(
    (taskId: string): unknown | null => {
      const task: any = tasks[taskId as keyof typeof tasks];
      if (!task) return null;

      const siblings = getMissionTasks(task.missionId);
      const index = siblings.findIndex((s: any) => s.id === taskId);
      return index !== -1 && index < siblings.length - 1 ? siblings[index + 1] : null;
    },
    [tasks, getMissionTasks]
  );

  const advanceSiblings = useCallback(
    (completedTaskId: string) => {
      logger.debug('useTaskHierarchy', 'Advancing siblings', { completedTaskId });

      const task: any = tasks[completedTaskId as keyof typeof tasks];
      if (!task) return;

      const nextSibling: any = getNextSibling(completedTaskId);
      if (nextSibling) {
        setTasks((prev) => ({
          ...prev,
          [nextSibling.id]: { ...prev[nextSibling.id], status: 'pending' },
        }));
        logger.info('useTaskHierarchy', 'Advanced to next sibling', { siblingId: nextSibling.id });
      }
    },
    [tasks, getNextSibling, setTasks]
  );

  const recalculateMissionProgress = useCallback(
    (missionId: string) => {
      logger.debug('useTaskHierarchy', 'Recalculating mission progress', { missionId });

      const missionTasks = getMissionTasks(missionId);
      const completed = missionTasks.filter((t: any) => t.status === 'completed').length;
      const progress = missionTasks.length > 0 ? (completed / missionTasks.length) * 100 : 0;

      logger.info('useTaskHierarchy', 'Mission progress recalculated', { missionId, progress });
      return { progress, totalTasks: missionTasks.length, completedTasks: completed };
    },
    [getMissionTasks]
  );

  return {
    getMissionTasks,
    getChildTasks,
    getNextSibling,
    advanceSiblings,
    recalculateMissionProgress,
  };
};

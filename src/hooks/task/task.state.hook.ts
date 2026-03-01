// Feature: Task | Trace: README.md
/*
 * [Parent Feature/Milestone] Task
 * [Child Task/Issue] Task state management micro-hook
 * [Subtask] Handle task equality checks, progress derivation
 * [Upstream] Monolithic logic -> [Downstream] Single-responsibility hook
 * [Law Check] 78 lines | Passed 100-Line Law
 */

import { useCallback } from 'react';

export const useTaskStateManagement = (tasks: Record<string, unknown>) => {
  const areSubActionsEqual = useCallback((a: unknown[], b: unknown[]): boolean => {
    if (a.length !== b.length) return false;
    return a.every((item, idx) => JSON.stringify(item) === JSON.stringify(b[idx]));
  }, []);

  const isTaskEquivalent = useCallback(
    (task1: any, task2: any): boolean => {
      return (
        task1.id === task2.id &&
        task1.status === task2.status &&
        task1.progress === task2.progress &&
        areSubActionsEqual(task1.subActions || [], task2.subActions || [])
      );
    },
    [areSubActionsEqual]
  );

  const deriveProgress = useCallback((task: any): number => {
    if (!task.subActions || task.subActions.length === 0) return 0;
    const completed = task.subActions.filter((sa: any) => sa.status === 'completed').length;
    return (completed / task.subActions.length) * 100;
  }, []);

  const mergeTaskSnapshot = useCallback(
    (existing: any, incoming: any): any => {
      const isSame = isTaskEquivalent(existing, incoming);
      if (isSame) return existing;

      return {
        ...existing,
        ...incoming,
        subActions: incoming.subActions || existing.subActions,
        progress: deriveProgress(incoming),
        updatedAt: Date.now(),
      };
    },
    [isTaskEquivalent, deriveProgress]
  );

  return {
    areSubActionsEqual,
    isTaskEquivalent,
    deriveProgress,
    mergeTaskSnapshot,
  };
};

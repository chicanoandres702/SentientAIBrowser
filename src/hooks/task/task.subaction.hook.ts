// Feature: Task | Trace: README.md
/*
 * [Parent Feature/Milestone] Task
 * [Child Task/Issue] Sub-action state machine micro-hook
 * [Subtask] Manage sub-action progression (pending → in_progress → completed/failed)
 * [Upstream] Monolithic logic -> [Downstream] State machine hook
 * [Law Check] 65 lines | Passed 100-Line Law
 */

import { useCallback } from 'react';

export interface SubAction {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: string;
}

export const useSubActionStateMachine = () => {
  const advanceSubActions = useCallback((subActions: SubAction[], currentIndex: number): SubAction[] => {
    if (currentIndex < 0 || currentIndex >= subActions.length) return subActions;

    return subActions.map((sa, idx) => {
      if (idx < currentIndex) return { ...sa, status: 'completed' };
      if (idx === currentIndex) return { ...sa, status: 'in_progress' };
      return sa;
    });
  }, []);

  const markSubActionComplete = useCallback((subActions: SubAction[], index: number, result?: string): SubAction[] => {
    const updated = [...subActions];
    if (updated[index]) {
      updated[index] = { ...updated[index], status: 'completed', result };
    }
    return updated;
  }, []);

  const markSubActionFailed = useCallback((subActions: SubAction[], index: number, result?: string): SubAction[] => {
    const updated = [...subActions];
    if (updated[index]) {
      updated[index] = { ...updated[index], status: 'failed', result };
    }
    return updated;
  }, []);

  const getActiveSubAction = useCallback((subActions: SubAction[]): SubAction | null => {
    return subActions.find((sa) => sa.status === 'in_progress') || null;
  }, []);

  const hasFailedSubActions = useCallback((subActions: SubAction[]): boolean => {
    return subActions.some((sa) => sa.status === 'failed');
  }, []);

  return {
    advanceSubActions,
    markSubActionComplete,
    markSubActionFailed,
    getActiveSubAction,
    hasFailedSubActions,
  };
};

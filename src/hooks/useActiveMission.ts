// Feature: Tasks | Trace: src/hooks/useActiveMission.ts
/*
 * [Memoized Hook] Mission selection for UI
 * [Upstream] Features/Tasks → [Downstream] Components
 * [Law Check] 19 lines | Passed
 */
import { useMemo } from 'react';
import { TaskItem } from '../features/tasks/types';

/**
 * Get the active mission from task list
 * Why: Missions are special — shown as header, not in task queue
 * Returns: Mission item or null
 */
export const useActiveMission = (tasks: TaskItem[]) =>
  useMemo(() => {
    const activeMission = tasks.find(
      t => t.isMission && t.status !== 'completed' && t.status !== 'failed'
    );
    return activeMission || tasks.find(t => t.isMission) || null;
  }, [tasks]);

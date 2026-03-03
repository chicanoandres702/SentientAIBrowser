/*
 * [Parent Feature/Milestone] Routines
 * [Child Task/Issue] Saved workflow state hook
 * [Subtask] Subscribe to Firestore routines, expose run callback
 * [Upstream] routine-sync.service -> [Downstream] routine-picker.component
 * [Law Check] 42 lines | Passed 100-Line Law
 */
import { useState, useEffect, useCallback } from 'react';
import { listenToRoutines } from '../../../shared/routine-sync.service';
import type { RoutineItem } from './routines.types';

interface UseRoutinesResult {
  routines: RoutineItem[];
  loading:  boolean;
  runRoutine: (routine: RoutineItem, onExecutePrompt: (p: string) => Promise<void>) => Promise<void>;
}

export function useRoutines(userId: string | null | undefined): UseRoutinesResult {
  const [routines, setRoutines] = useState<RoutineItem[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); setRoutines([]); return; }
    const unsub = listenToRoutines(userId, (items) => {
      setRoutines(items as RoutineItem[]);
      setLoading(false);
    });
    return unsub;
  }, [userId]);

  const runRoutine = useCallback(async (
    routine: RoutineItem,
    onExecutePrompt: (p: string) => Promise<void>,
  ) => {
    // Re-construct the goal from the routine's name + steps for the LLM
    const goal = routine.steps.length > 0
      ? `${routine.name}: ${routine.steps.join(' → ')}`
      : routine.name;
    await onExecutePrompt(goal);
  }, []);

  return { routines, loading, runRoutine };
}

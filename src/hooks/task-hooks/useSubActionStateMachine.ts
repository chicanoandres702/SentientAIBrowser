// Feature: Tasks | Trace: README.md
/*
 * [Parent Feature/Milestone] Tasks
 * [Child Task/Issue] useTaskQueue refactor
 * [Subtask] Sub-action state machine and progression logic
 * [Upstream] SubAction array -> [Downstream] Updated SubAction array
 * [Law Check] 65 lines | Passed 100-Line Law
 */
import { useCallback } from 'react';
import { TaskItem, TaskStatus } from '../../features/tasks/types';

/** State machine for sub-action progression */
export const useSubActionStateMachine = () => {
    const advanceSubActions = useCallback((
        subActions: TaskItem['subActions'],
        nextStatus: TaskStatus,
        _details?: string,
    ): TaskItem['subActions'] => {
        if (!subActions || subActions.length === 0) return subActions;
        const updated = subActions.map(sa => ({ ...sa }));

        if (nextStatus === 'in_progress') {
            if (!updated.some(sa => sa.status === 'in_progress' || sa.status === 'completed')) {
                const firstPending = updated.find(sa => sa.status === 'pending');
                if (firstPending) firstPending.status = 'in_progress';
            }
            return updated;
        }

        if (nextStatus === 'completed') {
            return updated.map(sa =>
                sa.status !== 'completed' ? { ...sa, status: 'completed' as TaskStatus } : sa
            );
        }

        if (nextStatus === 'failed') {
            const target = updated.find(sa => sa.status === 'in_progress') || updated.find(sa => sa.status === 'pending');
            if (target) target.status = 'failed';
            return updated;
        }

        return updated;
    }, []);

    return { advanceSubActions };
};

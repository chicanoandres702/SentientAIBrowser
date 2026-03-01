// Feature: Planning | Why: Merge strategy for reassessed plan — removes old pending, adds new tasks
import { TaskItem, TaskStatus, SubAction } from '../features/tasks/types';

interface MergeDeps {
    addTask: (title: string, status: TaskStatus, details?: string, extra?: Partial<TaskItem>) => Promise<any>;
    removeTask: (id: string) => void;
}

/** Replace pending tasks with freshly planned segments, skip already-completed titles */
export const mergeReassessedTasks = async (
    newSegments: Array<{ name: string; steps: any[] }>,
    pendingTasks: TaskItem[],
    completedTasks: TaskItem[],
    childTasks: TaskItem[],
    missionId: string,
    deps: MergeDeps,
) => {
    // Remove stale pending tasks
    for (const pt of pendingTasks) deps.removeTask(pt.id);

    // Add freshly planned tasks
    for (let i = 0; i < newSegments.length; i++) {
        const seg = newSegments[i];
        const steps = seg.steps || [];
        const segName = seg.name || `Step ${i + 1}`;

        // Skip if this task was already completed (fuzzy match on name)
        const alreadyDone = completedTasks.some(
            ct => ct.title.toLowerCase() === segName.toLowerCase(),
        );
        if (alreadyDone) continue;

        const subActions: SubAction[] = steps.map((step: any) => ({
            action: step.action || 'interact',
            goal: step.goal || segName,
            explanation: step.explanation || step.action,
            status: 'pending' as TaskStatus,
        }));

        // First new task is active if nothing is currently in_progress
        const hasActive = childTasks.some(t => t.status === 'in_progress');
        const status: TaskStatus = (i === 0 && !hasActive) ? 'in_progress' : 'pending';

        await deps.addTask(segName, status, `${steps.length} action${steps.length !== 1 ? 's' : ''}`, {
            missionId,
            subActions,
            estimatedDuration: steps.length * 15000,
            startTime: status === 'in_progress' ? Date.now() : undefined,
        });
    }

    return newSegments.length;
};

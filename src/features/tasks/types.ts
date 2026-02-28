// Feature: Tasks | Trace: src/features/tasks/trace.md
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked_on_user';

export interface SubAction {
    action: string;
    explanation: string;
    status: TaskStatus;
}

export interface TaskItem {
    id: string;
    title: string;
    status: TaskStatus;
    timestamp: number;
    details?: string;
    category?: string;
    startTime?: number;
    completedTime?: number;
    estimatedDuration?: number;
    progress?: number;
    /** Links this task to a parent mission */
    missionId?: string;
    /** True if this task IS the top-level mission entry */
    isMission?: boolean;
    /** Background sub-actions (clicks, types, waits) hidden under this task */
    subActions?: SubAction[];
}

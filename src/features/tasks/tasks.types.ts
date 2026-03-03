// Feature: Tasks | Trace: src/features/tasks/tasks.types.ts
/*
 * [Core Domain] Mission task execution
 * [Upstream] Workflow → [Downstream] Utils/Service
 * [Law Check] 60 lines | Passed
 */

/**
 * SubAction: atomic subtask with explicit goal and status
 * Status: 'pending', 'running', 'finished', 'failed'
 */
export interface SubAction {
    action: string;
    goal: string; // required: every subtask must have a goal
    explanation?: string;
    status: SubtaskStatus;
}

export interface TaskItem {
    id: string;
    missionId?: string;
    tabId: string;
    title: string;
    action?: string;
    status: TaskStatus;
    targetId?: string;
    value?: string;
    explanation?: string;
    timestamp?: number;
    order?: number;
    isMission?: boolean;
    progress?: number;
    details?: string;
    /** Subtasks: each with explicit goal and status */
    subActions?: SubAction[];
    runId?: string;
    workflowId?: string;
    workspaceId?: string;
    source?: 'planner' | 'manual' | 'fallback';
    startTime?: number;
    completedTime?: number;
    estimatedDuration?: number;
}
/**
 * SubtaskStatus: status for atomic subtasks
 * Values: 'pending', 'running', 'finished', 'failed'
 */
export type SubtaskStatus = 'pending' | 'running' | 'finished' | 'failed';

export interface MissionTask {
    id: string;
    title: string;
    action: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    targetId?: string;
    value?: string;
    explanation?: string;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked_on_user';

export interface TaskFilter {
    status?: TaskStatus;
    tabId?: string;
    missionId?: string;
}

// Feature: Tasks | Trace: src/features/tasks/tasks.types.ts
/*
 * [Core Domain] Mission task execution
 * [Upstream] Workflow → [Downstream] Utils/Service
 * [Law Check] 60 lines | Passed
 */

export interface SubAction {
    action: string;
    goal?: string;
    explanation: string;
    status: TaskStatus;
}

export interface TaskItem {
    id: string;
    missionId?: string;
    tabId: string;
    title: string;
    action?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked_on_user';
    targetId?: string;
    value?: string;
    explanation?: string;
    timestamp?: number;
    order?: number;
    isMission?: boolean;
    progress?: number;
    details?: string;
    /** Background sub-actions (clicks, types, waits) hidden under this task */
    subActions?: SubAction[];
    /** Mission run identifier for multi-run analytics */
    runId?: string;
    /** Logical workflow grouping (usually current tab/workflow id) */
    workflowId?: string;
    /** Workspace scope grouping (user/org/project level) */
    workspaceId?: string;
    /** Task source for telemetry and routing */
    source?: 'planner' | 'manual' | 'fallback';
    startTime?: number;
    completedTime?: number;
    estimatedDuration?: number;
}

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

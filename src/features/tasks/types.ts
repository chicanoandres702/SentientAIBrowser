export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked_on_user';

export interface TaskItem {
    id: string;
    title: string;
    status: TaskStatus;
    timestamp: number;
    details?: string;
    category?: string;
}

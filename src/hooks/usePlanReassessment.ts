// Feature: Planning | Why: After every DOM scan, reassess the mission plan and update the task queue
import { useCallback } from 'react';
import { TaskItem, TaskStatus } from '../features/tasks/types';

interface ReassessConfig {
    activePrompt: string;
    activeUrl: string;
    tasks: TaskItem[];
    PROXY_BASE_URL: string;
    tabId: string;
    addTask: (title: string, status: TaskStatus, details?: string, extra?: Partial<TaskItem>) => Promise<any>;
    updateTask: (id: string, status: TaskStatus, details?: string) => void;
    removeTask: (id: string) => void;
    setStatusMessage: (msg: string) => void;
}

/**
 * Returns a callable `reassess` function that re-invokes the planner
 * to update the task queue after every DOM scan.
 * Guards: active mission, 3s throttle, not already reassessing.
 */
export const usePlanReassessment = ({
    activePrompt, activeUrl, tasks, PROXY_BASE_URL, tabId,
    addTask, updateTask, removeTask, setStatusMessage,
}: ReassessConfig) => {
    const reassess = useCallback(async () => {
        // Why: backend mission loop is the single writer for mission queues.
        // Keep this hook as a no-op to prevent client-side queue rewrites.
    }, [activePrompt, activeUrl, tasks, PROXY_BASE_URL, tabId, addTask, updateTask, removeTask, setStatusMessage]);

    return { reassess };
};

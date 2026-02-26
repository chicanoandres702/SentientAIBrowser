// Feature: Tasks | Trace: README.md
// Why: Poll at 30s (was 5s) and skip polling when tab is hidden to save network/CPU.
import { useEffect, useRef } from 'react';
import axios from 'axios';
import { TaskItem } from '../features/tasks/types';

const PROXY_URL = 'http://localhost:3000/proxy/tasks';
const POLL_INTERVAL_MS = 30_000; // 30s — tasks don't need sub-second freshness

export const useTaskFileWatcher = (tasks: TaskItem[], setTasks: (tasks: TaskItem[]) => void) => {
    const tasksRef = useRef(tasks);

    useEffect(() => {
        tasksRef.current = tasks;
    }, [tasks]);

    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval> | null = null;

        const pollTasks = async () => {
            // Skip network call if browser tab is backgrounded
            if (document.visibilityState === 'hidden') return;

            try {
                const response = await axios.get(PROXY_URL);
                if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                    // Why: only add tasks from file that aren't already in memory.
                    // Never replace — user deletions must survive across polls.
                    const currentIds = new Set(tasksRef.current.map((t: any) => t.id));
                    const newOnly = response.data.filter((t: any) => !currentIds.has(t.id));
                    if (newOnly.length > 0) {
                        setTasks([...tasksRef.current, ...newOnly]);
                    }
                }
            } catch {
                // Proxy may not be running — silent fail is intentional
            }
        };

        const start = () => {
            pollTasks();
            intervalId = setInterval(pollTasks, POLL_INTERVAL_MS);
        };

        const stop = () => {
            if (intervalId) clearInterval(intervalId);
            intervalId = null;
        };

        // Pause/resume polling with tab visibility
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') start();
            else stop();
        };

        document.addEventListener('visibilitychange', onVisibilityChange);
        start();

        return () => {
            stop();
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [setTasks]);

    const syncTaskToFile = async (updatedTasks: TaskItem[]) => {
        try {
            await axios.post(PROXY_URL, updatedTasks);
        } catch {
            console.error('[Watcher] Failed to sync tasks to file');
        }
    };

    return { syncTaskToFile };
};

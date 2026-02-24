import { useEffect, useRef } from 'react';
import axios from 'axios';
import { TaskItem } from '../features/tasks/types';

const PROXY_URL = 'http://localhost:3000/proxy/tasks';

export const useTaskFileWatcher = (tasks: TaskItem[], setTasks: (tasks: TaskItem[]) => void) => {
    const tasksRef = useRef(tasks);

    useEffect(() => {
        tasksRef.current = tasks;
    }, [tasks]);

    useEffect(() => {
        // Simple polling for file changes via the proxy
        const pollTasks = async () => {
            try {
                const response = await axios.get(PROXY_URL);
                if (response.data && Array.isArray(response.data)) {
                    // Only update if different to avoid infinite loops if setTasks is stable
                    // Using a simple JSON stringify check for deep comparison
                    const newTasksStr = JSON.stringify(response.data);
                    const currentTasksStr = JSON.stringify(tasksRef.current);
                    
                    if (newTasksStr !== currentTasksStr) {
                        setTasks(response.data);
                    }
                }
            } catch (e) {
                console.warn("[Watcher] Failed to fetch tasks from proxy");
            }
        };

        const interval = setInterval(pollTasks, 5000);
        pollTasks(); // Initial fetch

        return () => clearInterval(interval);
    }, [setTasks]);

    const syncTaskToFile = async (updatedTasks: TaskItem[]) => {
        try {
            await axios.post(PROXY_URL, updatedTasks);
        } catch (e) {
            console.error("[Watcher] Failed to sync tasks to file");
        }
    };

    return { syncTaskToFile };
};

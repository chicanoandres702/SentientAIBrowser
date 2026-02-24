// Feature: Tasks | Trace: README.md
import { useState, useEffect, useCallback } from 'react';
import { auth } from '../features/auth/firebase-config';
import { TaskItem, TaskStatus } from '../features/tasks/types';
import { useGitAutoCommit } from './useGitAutoCommit';
import { syncTaskToFirestore, updateTaskInFirestore, removeTaskFromFirestore, hydrateTasksFromFirestore } from '../utils/task-sync-service';

export const useTaskQueue = () => {
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const { handleAutoCommit } = useGitAutoCommit();

    useEffect(() => {
        const hydrate = async () => {
            if (!auth.currentUser) return;
            try {
                const loadedTasks = await hydrateTasksFromFirestore(auth.currentUser.uid);
                if (loadedTasks.length > 0) setTasks(loadedTasks);
            } catch (e) { console.error("Hydration failed:", e); }
        };
        hydrate();
    }, [auth.currentUser]);

    const addTask = useCallback(async (title: string, status: TaskStatus = 'pending', details?: string) => {
        const id = Date.now().toString() + Math.random().toString();
        const newTask: TaskItem = { id, title, status, timestamp: Date.now(), details };
        setTasks(prev => [...prev, newTask]);
        try {
            await syncTaskToFirestore(newTask, auth.currentUser?.uid || 'anonymous');
        } catch (e) { console.error("Task add sync failed:", e); }
        return id;
    }, []);

    const updateTask = useCallback(async (id: string, status: TaskStatus, details?: string) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status, details: details || t.details } : t));
        if (status === 'completed' || status === 'failed') handleAutoCommit(`AI: Task ${status}`);
        try {
            await updateTaskInFirestore(id, { status, details: details || "" });
        } catch (e) { console.error("Task update sync failed:", e); }
    }, [handleAutoCommit]);

    const removeTask = useCallback(async (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
        try {
            await removeTaskFromFirestore(id);
            handleAutoCommit("AI: Task removed");
        } catch (e) { console.error("Task remove sync failed:", e); }
    }, [handleAutoCommit]);

    const clearTasks = useCallback(async () => {
        const currentTasks = tasks;
        setTasks([]);
        try {
            for (const t of currentTasks) await removeTaskFromFirestore(t.id);
            handleAutoCommit("AI: Task purge");
        } catch (e) { console.error("Task clear sync failed:", e); }
    }, [handleAutoCommit, tasks]);

    return { tasks, setTasks, addTask, updateTask, removeTask, clearTasks, editTask: () => {} };
};

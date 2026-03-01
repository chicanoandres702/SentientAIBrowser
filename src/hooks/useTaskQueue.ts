// Feature: Tasks | Trace: README.md
// Why: User tasks are ephemeral — memory only. Only routines persist to Firestore.
// Firestore sync has been removed from this hook intentionally.
import { useState, useCallback } from 'react';
import { TaskItem, TaskStatus } from '../features/tasks/types';

export const useTaskQueue = () => {
    const [tasks, setTasks] = useState<TaskItem[]>([]);

    const addTask = useCallback((title: string, status: TaskStatus = 'pending', details?: string) => {
        const id = Date.now().toString() + Math.random().toString();
        const newTask: TaskItem = { id, title, status, timestamp: Date.now(), details: details ?? '' };
        setTasks(prev => [...prev, newTask]);
        return id;
    }, []);

    const updateTask = useCallback((id: string, status: TaskStatus, details?: string) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status, details: details || t.details } : t));
    }, []);

    const removeTask = useCallback((id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
    }, []);

    const clearTasks = useCallback(() => {
        setTasks([]);
    }, []);

    const editTask = useCallback((id: string, title: string) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, title } : t));
    }, []);

    return { tasks, setTasks, addTask, updateTask, removeTask, clearTasks, editTask };
};

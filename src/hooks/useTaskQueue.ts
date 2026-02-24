import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, limit, getDocs, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../features/auth/firebase-config';
import { TaskItem, TaskStatus } from '../features/tasks/types';
import { sanitizeForCloud } from '../utils/safe-cloud.utils';
import { useGitAutoCommit } from './useGitAutoCommit';

export const useTaskQueue = () => {
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const { handleAutoCommit } = useGitAutoCommit();

    useEffect(() => {
        const hydrateTasks = async () => {
            if (!auth.currentUser) return;
            try {
                const q = query(
                    collection(db, 'task_queues'),
                    where('user_id', '==', auth.currentUser.uid),
                    orderBy('timestamp', 'desc'),
                    limit(10)
                );
                const querySnapshot = await getDocs(q);
                const loadedTasks: TaskItem[] = [];
                querySnapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    loadedTasks.push({
                        id: data.id,
                        title: data.title,
                        status: data.status,
                        timestamp: data.timestamp,
                        details: data.details,
                        category: data.category
                    });
                });
                if (loadedTasks.length > 0) setTasks(loadedTasks.reverse());
            } catch (e) {
                console.error("Failed to hydrate tasks:", e);
            }
        };
        hydrateTasks();
    }, [auth.currentUser]);

    const addTask = useCallback(async (title: string, status: TaskStatus = 'pending', details?: string) => {
        const id = Date.now().toString() + Math.random().toString();
        
        let category: string | undefined;
        const categoryMatch = title.match(/^\[([a-zA-Z]+)\]|^(?:([a-zA-Z]+):)/);
        if (categoryMatch) {
            category = (categoryMatch[1] || categoryMatch[2]).toLowerCase();
            if (category === 'feat') category = 'feature';
        }

        const newTask: TaskItem = { id, title, status, timestamp: Date.now(), details, category };
        setTasks(prev => [...prev, newTask]);
        try {
            const taskRef = doc(db, 'task_queues', id);
            await setDoc(taskRef, sanitizeForCloud({
                ...newTask,
                user_id: auth.currentUser?.uid || 'anonymous',
                server_timestamp: serverTimestamp(),
                updated_at: serverTimestamp()
            }));
        } catch (e) { console.error("Task sync failed:", e); }
        return id;
    }, []);

    const updateTask = useCallback(async (id: string, status: TaskStatus, details?: string) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status, details: details || t.details } : t));
        
        if (status === 'completed' || status === 'failed') {
            handleAutoCommit(`AI: Task marked as ${status}`);
        }

        try {
            const taskRef = doc(db, 'task_queues', id);
            await updateDoc(taskRef, sanitizeForCloud({
                status,
                details: details || "",
                updated_at: serverTimestamp()
            }));
        } catch (e) { console.error("Task update failed:", e); }
    }, [handleAutoCommit]);

    const removeTask = useCallback(async (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
        try {
            const taskRef = doc(db, 'task_queues', id);
            await deleteDoc(taskRef);
            handleAutoCommit("AI: Task removed from queue");
        } catch (e) { console.error("Task remove failed:", e); }
    }, [handleAutoCommit]);

    const editTask = useCallback(async (id: string, newTitle: string) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, title: newTitle } : t));
        try {
            const taskRef = doc(db, 'task_queues', id);
            await updateDoc(taskRef, sanitizeForCloud({
                title: newTitle,
                updated_at: serverTimestamp()
            }));
        } catch (e) { console.error("Task edit failed:", e); }
    }, []);

    const clearTasks = useCallback(async () => {
        const currentTasks = tasks;
        setTasks([]);
        try {
            for (const t of currentTasks) {
                const taskRef = doc(db, 'task_queues', t.id);
                await deleteDoc(taskRef);
            }
            handleAutoCommit("AI: Triggered Prime Purge on tasks");
        } catch (e) { console.error("Task clear failed:", e); }
    }, [handleAutoCommit, tasks]);

    return { tasks, setTasks, addTask, updateTask, removeTask, clearTasks, editTask };
};

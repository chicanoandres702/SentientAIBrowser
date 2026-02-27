// Feature: Tasks | Trace: src/features/tasks/trace.md
import { collection, query, where, orderBy, limit, getDocs, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../features/auth/firebase-config';
import { TaskItem, TaskStatus } from '../features/tasks/types';
import { sanitizeForCloud } from '../../shared/safe-cloud.utils';

export const syncTaskToFirestore = async (task: TaskItem, userId: string) => {
    const taskRef = doc(db, 'task_queues', task.id);
    await setDoc(taskRef, sanitizeForCloud({
        ...task,
        user_id: userId,
        server_timestamp: serverTimestamp(),
        updated_at: serverTimestamp()
    }));
};

export const updateTaskInFirestore = async (id: string, updates: Partial<TaskItem>) => {
    const taskRef = doc(db, 'task_queues', id);
    await updateDoc(taskRef, sanitizeForCloud({
        ...updates,
        updated_at: serverTimestamp()
    }));
};

export const removeTaskFromFirestore = async (id: string) => {
    const taskRef = doc(db, 'task_queues', id);
    await deleteDoc(taskRef);
};

export const hydrateTasksFromFirestore = async (userId: string) => {
    const q = query(
        collection(db, 'task_queues'),
        where('user_id', '==', userId),
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
        } as TaskItem);
    });
    return loadedTasks.reverse();
};

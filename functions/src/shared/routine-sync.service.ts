// Feature: Routines | Trace: src/utils/browser-sync-service.ts
import { db } from '../auth/firebase-config';
import { sanitizeForCloud } from './safe-cloud.utils';

export interface RoutineItem {
    id: string; name: string; description: string;
    initialUrl: string; steps: string[]; createdAt: number; userId: string;
}

export const syncRoutineToFirestore = async (routine: RoutineItem) => {
    const ref = db.collection('routines').doc(routine.id);
    await ref.set(sanitizeForCloud({ ...routine, updated_at: new Date().toISOString() }));
};

export const listenToRoutines = (userId: string, callback: (routines: RoutineItem[]) => void) => {
    return db.collection('routines')
        .where('userId', '==', userId)
        .orderBy('updated_at', 'desc')
        .onSnapshot((snapshot) => {
            const routines: RoutineItem[] = [];
            snapshot.forEach((doc) => routines.push({ ...doc.data(), id: doc.id } as RoutineItem));
            callback(routines);
        });
};

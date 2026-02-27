// Feature: Routines | Trace: src/utils/browser-sync-service.ts
import { collection, doc, setDoc, onSnapshot, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase.utils';
import { sanitizeForCloud } from './safe-cloud.utils';

export interface RoutineItem {
    id: string; name: string; description: string;
    initialUrl: string; steps: string[]; createdAt: number; userId: string;
}

export const syncRoutineToFirestore = async (routine: RoutineItem) => {
    const ref = doc(db, 'routines', routine.id);
    await setDoc(ref, sanitizeForCloud({ ...routine, updated_at: serverTimestamp() }));
};

export const listenToRoutines = (userId: string, callback: (routines: RoutineItem[]) => void) => {
    const q = query(
        collection(db, 'routines'),
        where('userId', '==', userId),
        orderBy('updated_at', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const routines: RoutineItem[] = [];
        snapshot.forEach((doc) => routines.push({ ...doc.data(), id: doc.id } as RoutineItem));
        callback(routines);
    });
};

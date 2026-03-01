// Feature: Missions | Trace: src/utils/browser-sync-service.ts
import { collection, doc, setDoc, updateDoc, onSnapshot, query, where, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase.utils';
import { sanitizeForCloud } from './safe-cloud.utils';

export interface MissionItem {
    id: string; goal: string; status: 'active' | 'paused' | 'completed' | 'failed' | 'waiting';
    tabId: string; progress: number; lastAction: string; lastReasoning?: string; timestamp: number; userId: string;
}

export const syncMissionToFirestore = async (mission: MissionItem) => {
    const ref = doc(db, 'missions', mission.id);
    await setDoc(ref, sanitizeForCloud({ ...mission, updated_at: serverTimestamp() }));
};

export const updateMissionInFirestore = async (id: string, updates: Partial<MissionItem>) => {
    const ref = doc(db, 'missions', id);
    await updateDoc(ref, sanitizeForCloud({ ...updates, updated_at: serverTimestamp() }));
};

export const listenToMissions = (userId: string, callback: (missions: MissionItem[]) => void) => {
    const q = query(
        collection(db, 'missions'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(20)
    );

    return onSnapshot(q, (snapshot) => {
        const missions: MissionItem[] = [];
        snapshot.forEach((doc) => missions.push({ ...doc.data(), id: doc.id } as MissionItem));
        callback(missions);
    });
};

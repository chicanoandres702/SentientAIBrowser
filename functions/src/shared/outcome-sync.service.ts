// Feature: Outcomes | Trace: src/utils/browser-sync-service.ts
import { collection, doc, setDoc, getDocs, query, where, limit, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase.utils';
import { sanitizeForCloud } from './safe-cloud.utils';

export interface MissionOutcome {
    id: string; goal: string; action: string; result: 'success' | 'failure';
    observation: string; timestamp: number; userId: string;
}

export const logMissionOutcome = async (outcome: MissionOutcome) => {
    const ref = doc(db, 'mission_outcomes', outcome.id);
    await setDoc(ref, sanitizeForCloud({ ...outcome, updated_at: serverTimestamp() }));
};

export const getRelevantOutcomes = async (userId: string, goalPattern: string) => {
    const q = query(collection(db, 'mission_outcomes'), where('userId', '==', userId), limit(20));
    const snap = await getDocs(q);
    const outcomes: MissionOutcome[] = [];
    snap.forEach(d => {
        const data = d.data() as MissionOutcome;
        if (data.goal.toLowerCase().includes(goalPattern.toLowerCase())) outcomes.push({ ...data, id: d.id });
    });
    return outcomes;
};

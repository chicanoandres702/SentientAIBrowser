// Feature: Core | Trace: src/hooks/useBrowserTabs.ts
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, limit, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../features/auth/firebase-config';
import { TabItem } from '../hooks/useBrowserTabs';
import { sanitizeForCloud } from './safe-cloud.utils';

export const syncTabToFirestore = async (tab: TabItem, userId: string) => {
    const tabRef = doc(db, 'browser_tabs', tab.id);
    await setDoc(tabRef, sanitizeForCloud({
        ...tab,
        user_id: userId,
        updated_at: serverTimestamp()
    }));
};

export const updateTabInFirestore = async (id: string, updates: Partial<TabItem>) => {
    const tabRef = doc(db, 'browser_tabs', id);
    await updateDoc(tabRef, sanitizeForCloud({
        ...updates,
        updated_at: serverTimestamp()
    }));
};

export const removeTabFromFirestore = async (id: string) => {
    const tabRef = doc(db, 'browser_tabs', id);
    await deleteDoc(tabRef);
};

export const listenToTabs = (userId: string, callback: (tabs: TabItem[]) => void) => {
    const q = query(
        collection(db, 'browser_tabs'),
        where('user_id', '==', userId),
        orderBy('updated_at', 'asc'),
        limit(10)
    );

    return onSnapshot(q, (snapshot) => {
        const tabs: TabItem[] = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            tabs.push({
                id: data.id,
                title: data.title,
                isActive: data.isActive,
                url: data.url
            } as TabItem);
        });
        callback(tabs);
    });
};

export interface MissionItem {
    id: string;
    goal: string;
    status: 'active' | 'paused' | 'completed' | 'failed';
    tabId: string;
    progress: number;
    lastAction: string;
    timestamp: number;
    userId: string;
}

export const syncMissionToFirestore = async (mission: MissionItem) => {
    const missionRef = doc(db, 'missions', mission.id);
    await setDoc(missionRef, sanitizeForCloud({
        ...mission,
        updated_at: serverTimestamp()
    }));
};

export const updateMissionInFirestore = async (id: string, updates: Partial<MissionItem>) => {
    const missionRef = doc(db, 'missions', id);
    await updateDoc(missionRef, sanitizeForCloud({
        ...updates,
        updated_at: serverTimestamp()
    }));
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
        snapshot.forEach((doc) => {
            const data = doc.data();
            missions.push({
                ...data,
                id: doc.id
            } as MissionItem);
        });
        callback(missions);
    });
};

export interface RoutineItem {
    id: string;
    name: string;
    description: string;
    initialUrl: string;
    steps: string[];
    createdAt: number;
    userId: string;
}

export const syncRoutineToFirestore = async (routine: RoutineItem) => {
    const routineRef = doc(db, 'routines', routine.id);
    await setDoc(routineRef, sanitizeForCloud({
        ...routine,
        updated_at: serverTimestamp()
    }));
};

export const listenToRoutines = (userId: string, callback: (routines: RoutineItem[]) => void) => {
    const q = query(
        collection(db, 'routines'),
        where('userId', '==', userId),
        orderBy('updated_at', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const routines: RoutineItem[] = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            routines.push({
                ...data,
                id: doc.id
            } as RoutineItem);
        });
        callback(routines);
    });
};

export interface MissionOutcome {
    id: string;
    goal: string;
    action: string;
    result: 'success' | 'failure';
    observation: string;
    timestamp: number;
    userId: string;
}

export const logMissionOutcome = async (outcome: MissionOutcome) => {
    const outcomeRef = doc(db, 'mission_outcomes', outcome.id);
    await setDoc(outcomeRef, sanitizeForCloud({
        ...outcome,
        updated_at: serverTimestamp()
    }));
};

export const getRelevantOutcomes = async (userId: string, goalPattern: string) => {
    const q = query(
        collection(db, 'mission_outcomes'),
        where('userId', '==', userId),
        limit(20)
    );
    
    // In a real implementation, we'd use semantic search. 
    // For now, we fetch recent and filter.
    const snapshot = await getDocs(q);
    const outcomes: MissionOutcome[] = [];
    snapshot.forEach(doc => {
        const data = doc.data() as MissionOutcome;
        if (data.goal.toLowerCase().includes(goalPattern.toLowerCase())) {
            outcomes.push({ ...data, id: doc.id });
        }
    });
    return outcomes;
};

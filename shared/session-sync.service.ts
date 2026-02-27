// Feature: Sessions | Trace: src/utils/browser-sync-service.ts
import { doc, setDoc, getDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase.utils';
import { sanitizeForCloud } from './safe-cloud.utils';

/** Represents a persisted browser session for cross-device continuity. */
export interface SessionData {
    userId: string;
    cookies: string;
    localStorage: string;
    activeTabId: string;
    lastUrl: string;
    updatedAt?: unknown;
}

/**
 * Persist or overwrite the current browser session to Firestore.
 * Uses the userId as the doc ID for 1:1 mapping.
 */
export const syncSession = async (userId: string, data: Omit<SessionData, 'userId'>) => {
    const ref = doc(db, 'user_sessions', userId);
    await setDoc(ref, sanitizeForCloud({
        ...data,
        userId,
        updatedAt: serverTimestamp()
    }), { merge: true });
};

/** Hydrate session data from Firestore on app startup. */
export const getSession = async (userId: string): Promise<SessionData | null> => {
    const ref = doc(db, 'user_sessions', userId);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as SessionData) : null;
};

/** Real-time listener for session changes (e.g., another device updates). */
export const listenToSession = (
    userId: string,
    callback: (session: SessionData | null) => void
) => {
    const ref = doc(db, 'user_sessions', userId);
    return onSnapshot(ref, (snap) => {
        callback(snap.exists() ? (snap.data() as SessionData) : null);
    });
};

// Feature: Knowledge | Trace: src/utils/browser-sync-service.ts
import {
    collection, doc, setDoc, getDocs, onSnapshot,
    query, where, orderBy, limit, serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase.utils';
import { sanitizeForCloud } from './safe-cloud.utils';

/** A single user knowledge entry — scoped to a context like a domain. */
export interface KnowledgeEntry {
    id: string;
    userId: string;
    contextId: string;
    type: 'rule' | 'fact' | 'preference';
    content: string;
    updatedAt?: unknown;
}

/** Save (upsert) a knowledge entry for the current user. */
export const saveKnowledge = async (entry: KnowledgeEntry) => {
    const ref = doc(db, 'user_knowledge', entry.id);
    await setDoc(ref, sanitizeForCloud({
        ...entry,
        updated_at: serverTimestamp()
    }), { merge: true });
};

/** Fetch knowledge entries for a user filtered by context. */
export const getKnowledge = async (
    userId: string, contextId: string, max = 20
): Promise<KnowledgeEntry[]> => {
    const q = query(
        collection(db, 'user_knowledge'),
        where('userId', '==', userId),
        where('contextId', '==', contextId),
        orderBy('updated_at', 'desc'),
        limit(max)
    );
    const snap = await getDocs(q);
    const entries: KnowledgeEntry[] = [];
    snap.forEach(d => entries.push({ ...d.data(), id: d.id } as KnowledgeEntry));
    return entries;
};

/** Real-time listener for knowledge updates in a specific context. */
export const listenToKnowledge = (
    userId: string,
    contextId: string,
    callback: (entries: KnowledgeEntry[]) => void
) => {
    const q = query(
        collection(db, 'user_knowledge'),
        where('userId', '==', userId),
        where('contextId', '==', contextId),
        orderBy('updated_at', 'desc'),
        limit(50)
    );
    return onSnapshot(q, (snap) => {
        const entries: KnowledgeEntry[] = [];
        snap.forEach(d => entries.push({ ...d.data(), id: d.id } as KnowledgeEntry));
        callback(entries);
    });
};

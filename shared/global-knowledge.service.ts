// Feature: Global Knowledge | Trace: src/utils/browser-sync-service.ts
import {
    collection, addDoc, getDocs, query, where,
    orderBy, limit, serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase.utils';
import { sanitizeForCloud } from './safe-cloud.utils';

/** An anonymized, immutable global knowledge entry shared across users. */
export interface GlobalKnowledgeEntry {
    id?: string;
    category: string;
    content: string;
    source: string;
    createdAt?: unknown;
}

/**
 * Write an anonymized knowledge entry visible to all authenticated users.
 * These are immutable once created (per Firestore rules).
 */
export const addGlobalKnowledge = async (entry: Omit<GlobalKnowledgeEntry, 'id'>) => {
    await addDoc(collection(db, 'global_knowledge'), sanitizeForCloud({
        ...entry,
        created_at: serverTimestamp()
    }));
};

/** Search global knowledge entries by category keyword. */
export const searchGlobalKnowledge = async (
    category: string, max = 20
): Promise<GlobalKnowledgeEntry[]> => {
    const q = query(
        collection(db, 'global_knowledge'),
        where('category', '==', category),
        limit(max)
    );
    const snap = await getDocs(q);
    const entries: GlobalKnowledgeEntry[] = [];
    snap.forEach(d => entries.push({ ...d.data(), id: d.id } as GlobalKnowledgeEntry));
    return entries;
};

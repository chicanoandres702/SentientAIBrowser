// Feature: Browser | Trace: src/features/browser/hooks
import { useState, useEffect, useCallback } from 'react';
import { auth } from '../../auth/firebase-config';
import {
    saveKnowledge, getKnowledge, listenToKnowledge,
    KnowledgeEntry
} from '../../../../shared/knowledge-sync.service';

/**
 * useKnowledgeSync: Real-time CRUD for user-scoped contextual knowledge.
 * Entries are keyed by contextId (e.g., domain name).
 */
export const useKnowledgeSync = (contextId: string) => {
    const [entries, setEntries] = useState<KnowledgeEntry[]>([]);

    useEffect(() => {
        if (!auth.currentUser || !contextId) return;

        // Hydrate then listen
        getKnowledge(auth.currentUser.uid, contextId)
            .then(setEntries)
            .catch(e => console.error('Knowledge hydration failed:', e));

        const unsubscribe = listenToKnowledge(
            auth.currentUser.uid, contextId, setEntries
        );
        return () => unsubscribe();
    }, [auth.currentUser, contextId]);

    const addEntry = useCallback(async (
        type: KnowledgeEntry['type'], content: string
    ) => {
        if (!auth.currentUser) return;
        const id = `${contextId}_${Date.now()}`;
        const entry: KnowledgeEntry = {
            id, userId: auth.currentUser.uid,
            contextId, type, content
        };
        // Optimistic UI
        setEntries(prev => [entry, ...prev]);
        try {
            await saveKnowledge(entry);
        } catch (e) { console.error('Knowledge save failed:', e); }
    }, [contextId]);

    return { entries, addEntry };
};

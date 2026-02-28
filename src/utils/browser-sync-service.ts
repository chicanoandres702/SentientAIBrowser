// Feature: Core | Trace: src/hooks/useBrowserTabs.ts
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, limit, serverTimestamp, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../features/auth/firebase-config';
import { TabItem } from '../features/browser/types';
import { sanitizeForCloud } from '../../shared/safe-cloud.utils';

export * from '../../shared/mission-sync.service';
export * from '../../shared/routine-sync.service';
export * from '../../shared/outcome-sync.service';
export * from '../../shared/session-sync.service';
export * from '../../shared/knowledge-sync.service';
export * from '../../shared/global-knowledge.service';

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

/** Batch-update multiple tabs in a single Firestore round-trip (N writes → 1) */
export const batchUpdateTabs = async (updates: Array<{ id: string; changes: Partial<TabItem> }>) => {
    const batch = writeBatch(db);
    for (const { id, changes } of updates) {
        batch.update(doc(db, 'browser_tabs', id), sanitizeForCloud({ ...changes, updated_at: serverTimestamp() }));
    }
    await batch.commit();
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

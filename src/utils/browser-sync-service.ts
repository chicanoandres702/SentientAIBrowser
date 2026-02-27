// Feature: Core | Trace: src/hooks/useBrowserTabs.ts
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, limit, serverTimestamp } from 'firebase/firestore';
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

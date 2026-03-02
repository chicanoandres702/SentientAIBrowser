// Feature: Workflow | Trace: src/features/workflow/workflow.service.ts
/*
 * [Service Layer] Firestore sync
 * [Upstream] Utils → [Downstream] API/DB
 * [Law Check] 48 lines | Passed
 */

import { doc, setDoc, collection, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../auth/firebase-config';
import { TabItem } from './workflow.types';

export const syncNewTab = async (userId: string, tabs: TabItem[], newTab: TabItem): Promise<void> => {
    try {
        await setDoc(doc(db, 'users', userId, 'tabs', newTab.id), newTab);
    } catch (err) {
        console.error('[WorkflowService] syncNewTab failed:', err);
    }
};

export const syncCloseTab = async (userId: string, tabId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, 'users', userId, 'tabs', tabId));
    } catch (err) {
        console.error('[WorkflowService] syncCloseTab failed:', err);
    }
};

export const syncSelectTab = async (userId: string, tabs: TabItem[]): Promise<void> => {
    try {
        for (const tab of tabs) {
            await updateDoc(doc(db, 'users', userId, 'tabs', tab.id), { isActive: tab.isActive });
        }
    } catch (err) {
        console.error('[WorkflowService] syncSelectTab failed:', err);
    }
};

export const listenToWorkflow = (userId: string, onUpdate: (tabs: TabItem[]) => void): (() => void) => {
    return onSnapshot(collection(db, 'users', userId, 'tabs'), (snap) => {
        const tabs = snap.docs.map(d => d.data() as TabItem).sort((a, b) => a.id.localeCompare(b.id));
        onUpdate(tabs);
    });
};

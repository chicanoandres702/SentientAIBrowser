// Feature: Core | Why: Firestore sync helpers for browser tabs — keeps hook file under 100 lines
import { auth } from '../features/auth/firebase-config';
import { TabItem } from '../features/browser/types';
import {
    syncTabToFirestore, updateTabInFirestore, removeTabFromFirestore
} from '../utils/browser-sync-service';

/** Sync initial default tab to Firestore on mount */
export const syncInitialTab = async (tab: TabItem) => {
    if (!auth.currentUser) return;
    try {
        await syncTabToFirestore(tab, auth.currentUser.uid);
    } catch (e) { console.log('Init sync failed:', e); }
};

/** Deactivate all existing tabs then sync the new one */
export const syncNewTab = async (
    existingTabs: TabItem[],
    newTab: TabItem
) => {
    if (!auth.currentUser) return;
    try {
        for (const t of existingTabs) {
            if (t.isActive) await updateTabInFirestore(t.id, { isActive: false });
        }
        await syncTabToFirestore(newTab, auth.currentUser.uid);
    } catch (e) { console.error('Tab sync failed:', e); }
};

/** Remove a tab from Firestore */
export const syncCloseTab = async (id: string) => {
    if (!auth.currentUser) return;
    try { await removeTabFromFirestore(id); }
    catch (e) { console.error('Tab close sync failed:', e); }
};

/** Update isActive for all tabs in Firestore to reflect selection */
export const syncSelectTab = async (tabs: TabItem[], selectedId: string) => {
    if (!auth.currentUser) return;
    try {
        for (const t of tabs) {
            await updateTabInFirestore(t.id, { isActive: t.id === selectedId });
        }
    } catch (e) { console.error('Tab selection sync failed:', e); }
};

/** Update URL + title for the active tab in Firestore */
export const syncNavigate = async (
    tabId: string,
    url: string,
    title: string
) => {
    if (!auth.currentUser) return;
    try {
        await updateTabInFirestore(tabId, { url, title, isActive: true });
    } catch (e) { console.error('Tab URL sync failed:', e); }
};

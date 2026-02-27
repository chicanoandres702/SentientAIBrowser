// Feature: Core | Trace: README.md
import { useState, useCallback, useEffect } from 'react';
import { auth } from '../features/auth/firebase-config';
import { TabItem } from '../features/browser/types';
import {
    listenToTabs, syncTabToFirestore,
    updateTabInFirestore, removeTabFromFirestore
} from '../utils/browser-sync-service';

export type { TabItem };

const DEFAULT_URL = 'https://www.google.com';

export const useBrowserTabs = (initialUrl: string) => {
    const [tabs, setTabs] = useState<TabItem[]>([
        { id: '1', title: 'New Tab', isActive: true, url: initialUrl }
    ]);
    const [activeTabId, setActiveTabId] = useState('1');
    const [activeUrl, setActiveUrl] = useState(initialUrl);

    useEffect(() => {
        if (!auth.currentUser) return;
        const defaultTab = tabs.find(t => t.id === '1');
        if (defaultTab) {
            syncTabToFirestore(defaultTab, auth.currentUser.uid)
                .catch(e => console.log('Init sync failed:', e));
        }
        const unsubscribe = listenToTabs(auth.currentUser.uid, (cloudTabs) => {
            if (cloudTabs.length > 0) {
                setTabs(cloudTabs);
                const active = cloudTabs.find(t => t.isActive);
                if (active) { setActiveTabId(active.id); setActiveUrl(active.url); }
            }
        });
        return () => unsubscribe();
    }, [auth.currentUser]);

    const addNewTab = useCallback(async (url: string, title = 'New Tab') => {
        const id = Date.now().toString();
        const newTab: TabItem = { id, title, isActive: true, url };
        setTabs(prev => prev.map(t => ({ ...t, isActive: false })).concat(newTab));
        setActiveTabId(id);
        setActiveUrl(url);
        if (auth.currentUser) {
            try {
                for (const tab of tabs) {
                    if (tab.isActive) await updateTabInFirestore(tab.id, { isActive: false });
                }
                await syncTabToFirestore(newTab, auth.currentUser.uid);
            } catch (e) { console.error("Tab sync failed:", e); }
        }
    }, [auth.currentUser, tabs]);

    const closeTab = useCallback(async (id: string) => {
        if (auth.currentUser) {
            try { await removeTabFromFirestore(id); }
            catch (e) { console.error("Tab close sync failed:", e); }
        }
        setTabs(prev => {
            const nextTabs = prev.filter(t => t.id !== id);
            if (nextTabs.length === 0) {
                const homeTab: TabItem = { id: '1', title: 'Google', isActive: true, url: DEFAULT_URL };
                setActiveTabId('1');
                setActiveUrl(homeTab.url);
                return [homeTab];
            }
            if (id === activeTabId) {
                const lastTab = nextTabs[nextTabs.length - 1];
                setActiveTabId(lastTab.id);
                setActiveUrl(lastTab.url);
                return nextTabs.map(t => ({ ...t, isActive: t.id === lastTab.id }));
            }
            return nextTabs;
        });
    }, [activeTabId, auth.currentUser]);

    const selectTab = useCallback(async (id: string) => {
        if (auth.currentUser) {
            try {
                for (const tab of tabs) {
                    await updateTabInFirestore(tab.id, { isActive: tab.id === id });
                }
            } catch (e) { console.error("Tab selection sync failed:", e); }
        }
        setTabs(prev => {
            const tab = prev.find(t => t.id === id);
            if (tab) { setActiveTabId(id); setActiveUrl(tab.url); }
            return prev.map(t => ({ ...t, isActive: t.id === id }));
        });
    }, [auth.currentUser, tabs]);

    return { tabs, setTabs, activeTabId, activeUrl, setActiveUrl, addNewTab, closeTab, selectTab };
};

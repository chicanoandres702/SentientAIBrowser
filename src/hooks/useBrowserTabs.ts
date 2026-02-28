// Feature: Core | Why: Manages browser tab state (add, close, select, navigate) with Firestore sync
import { useState, useCallback, useEffect } from 'react';
import { auth } from '../features/auth/firebase-config';
import { TabItem } from '../features/browser/types';
import { listenToTabs } from '../utils/browser-sync-service';
import { syncInitialTab, syncNewTab, syncCloseTab, syncSelectTab, syncNavigate } from './browser-tab-sync';

export type { TabItem };

const DEFAULT_URL = 'https://www.google.com';

const deriveTitleFromUrl = (url: string) => {
    try { return new URL(url).hostname.replace(/^www\./, '') || 'New Tab'; }
    catch { return 'New Tab'; }
};

export const useBrowserTabs = (initialUrl: string) => {
    const [tabs, setTabs] = useState<TabItem[]>([{ id: '1', title: 'New Tab', isActive: true, url: initialUrl }]);
    const [activeTabId, setActiveTabId] = useState('1');
    const [activeUrl, setActiveUrl] = useState(initialUrl);

    useEffect(() => {
        if (!auth.currentUser) return;
        const defaultTab = tabs.find(t => t.id === '1');
        if (defaultTab) syncInitialTab(defaultTab);
        const unsub = listenToTabs(auth.currentUser.uid, (cloudTabs) => {
            if (cloudTabs.length > 0) {
                setTabs(cloudTabs);
                const active = cloudTabs.find(t => t.isActive);
                if (active) { setActiveTabId(active.id); setActiveUrl(active.url); }
            }
        });
        return () => unsub();
    }, [auth.currentUser]);

    const addNewTab = useCallback(async (url: string, title = 'New Tab') => {
        const id = Date.now().toString();
        const newTab: TabItem = { id, title, isActive: true, url };
        setTabs(prev => prev.map(t => ({ ...t, isActive: false })).concat(newTab));
        setActiveTabId(id); setActiveUrl(url);
        await syncNewTab(tabs, newTab);
    }, [tabs]);

    const closeTab = useCallback(async (id: string) => {
        await syncCloseTab(id);
        setTabs(prev => {
            const next = prev.filter(t => t.id !== id);
            if (next.length === 0) {
                const home: TabItem = { id: '1', title: 'Google', isActive: true, url: DEFAULT_URL };
                setActiveTabId('1'); setActiveUrl(home.url);
                return [home];
            }
            if (id === activeTabId) {
                const last = next[next.length - 1];
                setActiveTabId(last.id); setActiveUrl(last.url);
                return next.map(t => ({ ...t, isActive: t.id === last.id }));
            }
            return next;
        });
    }, [activeTabId]);

    const selectTab = useCallback(async (id: string) => {
        await syncSelectTab(tabs, id);
        setTabs(prev => {
            const tab = prev.find(t => t.id === id);
            if (tab) { setActiveTabId(id); setActiveUrl(tab.url); }
            return prev.map(t => ({ ...t, isActive: t.id === id }));
        });
    }, [tabs]);

    const navigateActiveTab = useCallback(async (nextUrl: string) => {
        setActiveUrl(nextUrl);
        const title = deriveTitleFromUrl(nextUrl);
        setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, url: nextUrl, title } : t));
        await syncNavigate(activeTabId, nextUrl, title);
    }, [activeTabId]);

    return { tabs, setTabs, activeTabId, activeUrl, setActiveUrl, navigateActiveTab, addNewTab, closeTab, selectTab };
};

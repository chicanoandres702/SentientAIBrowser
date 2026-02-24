// Feature: Core | Trace: README.md
import { useState, useCallback } from 'react';

export interface TabItem {
    id: string;
    title: string;
    isActive: boolean;
    url: string;
}

export const useBrowserTabs = (initialUrl: string) => {
    const [tabs, setTabs] = useState<TabItem[]>([
        { id: '1', title: 'New Tab', isActive: true, url: initialUrl }
    ]);
    const [activeTabId, setActiveTabId] = useState('1');
    const [activeUrl, setActiveUrl] = useState(initialUrl);

    const addNewTab = useCallback((url: string, title: string = 'New Tab') => {
        const id = Date.now().toString();
        const newTab = { id, title, isActive: true, url };
        setTabs(prev => prev.map(t => ({ ...t, isActive: false })).concat(newTab));
        setActiveTabId(id);
        setActiveUrl(url);
    }, []);

    const closeTab = useCallback((id: string) => {
        setTabs(prev => {
            const nextTabs = prev.filter(t => t.id !== id);
            if (nextTabs.length === 0) {
                const homeTab = { id: '1', title: 'Google', isActive: true, url: 'https://www.google.com' };
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
    }, [activeTabId]);

    const selectTab = useCallback((id: string) => {
        setTabs(prev => {
            const tab = prev.find(t => t.id === id);
            if (tab) {
                setActiveTabId(id);
                setActiveUrl(tab.url);
            }
            return prev.map(t => ({ ...t, isActive: t.id === id }));
        });
    }, []);

    return { tabs, setTabs, activeTabId, activeUrl, setActiveUrl, addNewTab, closeTab, selectTab };
};

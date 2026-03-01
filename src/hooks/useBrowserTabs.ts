// Feature: Core | Trace: README.md
import { useState, useCallback } from 'react';

export interface TabItem {
    id: string;
    title: string;
    isActive: boolean;
    url: string;
    taskId?: string;
    activePrompt?: string;
    statusMessage?: string;
    isPaused?: boolean;
    retryCount?: number;
    taskStartTime?: number | null;
}

export interface TabGroup {
    id: string;
    name: string;
    tabs: TabItem[];
}

export const useBrowserTabs = (initialUrl: string) => {
    // Start with a default group containing a default tab
    const defaultTabId = '1';
    const defaultGroupId = 'group-1';

    const [groups, setGroups] = useState<TabGroup[]>([
        {
            id: defaultGroupId,
            name: 'Main Mission',
            tabs: [{ id: defaultTabId, title: 'New Tab', isActive: true, url: initialUrl }]
        }
    ]);
    
    const [activeGroupId, setActiveGroupId] = useState(defaultGroupId);
    const [activeTabId, setActiveTabId] = useState(defaultTabId);
    const [activeUrl, setActiveUrl] = useState(initialUrl);

    // Creates a new group and auto-switches to it
    const addNewGroup = useCallback((name: string, firstTabUrl: string = 'https://www.google.com') => {
        const newGroupId = `group-${Date.now()}`;
        const newTabId = `tab-${Date.now()}`;
        
        setGroups(prev => [
            ...prev.map(g => {
                if (g.id === activeGroupId) {
                    return { ...g, tabs: g.tabs.map(t => ({ ...t, isActive: false })) };
                }
                return g;
            }),
            {
                id: newGroupId,
                name,
                tabs: [{ id: newTabId, title: 'New Tab', isActive: true, url: firstTabUrl }]
            }
        ]);
        
        setActiveGroupId(newGroupId);
        setActiveTabId(newTabId);
        setActiveUrl(firstTabUrl);
    }, [activeGroupId]);

    const addNewTab = useCallback((url: string, title: string = 'New Tab') => {
        const id = `tab-${Date.now()}`;
        const newTab = { id, title, isActive: true, url };
        
        setGroups(prev => prev.map(group => {
            if (group.id !== activeGroupId) return group;
            return {
                ...group,
                tabs: group.tabs.map(t => ({ ...t, isActive: false })).concat(newTab)
            };
        }));
        
        setActiveTabId(id);
        setActiveUrl(url);
    }, [activeGroupId]);

    const selectGroup = useCallback((groupId: string) => {
        setGroups(prev => {
            const group = prev.find(g => g.id === groupId);
            if (!group) return prev;
            
            const activeTabInGroup = group.tabs.find(t => t.isActive) || group.tabs[group.tabs.length - 1];
            if (activeTabInGroup) {
                setActiveTabId(activeTabInGroup.id);
                setActiveUrl(activeTabInGroup.url);
            }
            return prev;
        });
        setActiveGroupId(groupId);
    }, []);

    const closeTab = useCallback((id: string) => {
        setGroups(prev => {
            return prev.map(group => {
                if (group.id !== activeGroupId) return group;
                
                const nextTabs = group.tabs.filter(t => t.id !== id);
                if (nextTabs.length === 0) {
                    // If last tab closed, keep a default tab open
                    const homeTab = { id: `tab-${Date.now()}`, title: 'Google', isActive: true, url: 'https://www.google.com' };
                    if (group.id === activeGroupId) {
                        setTimeout(() => {
                            setActiveTabId(homeTab.id);
                            setActiveUrl(homeTab.url);
                        }, 0);
                    }
                    return { ...group, tabs: [homeTab] };
                }
                
                if (id === activeTabId) {
                    const lastTab = nextTabs[nextTabs.length - 1];
                    if (group.id === activeGroupId) {
                        setTimeout(() => {
                            setActiveTabId(lastTab.id);
                            setActiveUrl(lastTab.url);
                        }, 0);
                    }
                    return { ...group, tabs: nextTabs.map(t => ({ ...t, isActive: t.id === lastTab.id })) };
                }
                return { ...group, tabs: nextTabs };
            });
        });
    }, [activeGroupId, activeTabId]);

    const selectTab = useCallback((id: string) => {
        setGroups(prev => prev.map(group => {
            if (group.id !== activeGroupId) return group;
            
            const tab = group.tabs.find(t => t.id === id);
            if (tab) {
                setTimeout(() => {
                    setActiveTabId(id);
                    setActiveUrl(tab.url);
                }, 0);
            }
            return {
                ...group,
                tabs: group.tabs.map(t => ({ ...t, isActive: t.id === id }))
            };
        }));
    }, [activeGroupId]);

    const setTabState = useCallback((tabId: string, updates: Partial<TabItem>) => {
        setGroups(prev => prev.map(group => {
            const hasTab = group.tabs.some(t => t.id === tabId);
            if (!hasTab) return group;
            return {
                ...group,
                tabs: group.tabs.map(t => t.id === tabId ? { ...t, ...updates } : t)
            };
        }));
    }, []);

    return { 
        groups, setGroups, 
        activeGroupId, activeTabId, 
        activeUrl, setActiveUrl, 
        addNewGroup, selectGroup,
        addNewTab, closeTab, selectTab,
        setTabState
    };
};

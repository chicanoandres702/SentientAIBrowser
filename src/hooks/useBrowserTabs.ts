// Feature: Core | Why: Manages browser tab state (add, close, select, navigate) with Firestore sync
// Debounce on navigate prevents rapid URL changes from each firing a Firestore write → snapshot loop
import { useState, useCallback, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../features/auth/firebase-config';
import { TabItem } from '../features/workflow/workflow.types';
import { listenToWorkflow } from '../features/workflow/workflow.service';
import { syncInitialTab, syncNewTab, syncCloseTab, syncSelectTab, syncNavigate } from './browser-tab-sync';

const NAV_DEBOUNCE_MS = 400; // coalesce rapid URL changes (address-bar typing, redirects)

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
    // Why: store listener teardown so onAuthStateChanged can swap it when user changes account
    const tabUnsubRef = useRef<(() => void) | undefined>(undefined);
    // Why: debounce outgoing navigate writes so typing / redirects don't fire a Firestore write per event
    const navDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    // Why: write-lock prevents the snapshot callback from re-applying state we just wrote ourselves
    const isSyncingRef = useRef(false);
    // Why: tombstone — closed tab IDs are remembered for the session lifetime so Firestore
    // snapshot echoes (from the backend's in-flight captureAndSync) can never ghost a tab back.
    const closedTabIdsRef = useRef(new Set<string>());

    useEffect(() => {
        // Why: onAuthStateChanged fires AFTER the Firebase SDK has loaded a valid ID token
        // into the Firestore internal auth provider. Checking auth.currentUser directly is
        // unreliable at startup — the token may not have propagated yet → "Missing or
        // insufficient permissions" even though the user IS logged in.
        const authUnsub = onAuthStateChanged(auth, (user) => {
            tabUnsubRef.current?.();
            if (!user) return;
            const defaultTab = tabs.find(t => t.id === '1');
            if (defaultTab) syncInitialTab(defaultTab);
            tabUnsubRef.current = listenToWorkflow(user.uid, (cloudTabs) => {
                // Why: skip cloud updates that arrived as the echo of our own write
                if (isSyncingRef.current) return;
                // Why: filter out tombstoned (closed) tabs — the backend captureAndSync may
                // have re-written the doc after our delete; ignore it permanently.
                const live = cloudTabs.filter(t => !closedTabIdsRef.current.has(t.id));
                if (live.length > 0) {
                    setTabs(prev => {
                        const same = prev.length === live.length &&
                            prev.every((t, i) => t.id === live[i].id && t.url === live[i].url &&
                                t.title === live[i].title && t.isActive === live[i].isActive);
                        return same ? prev : live;
                    });
                    const active = live.find(t => t.isActive);
                    if (active) {
                        setActiveTabId(id => id === active.id ? id : active.id);
                        setActiveUrl(url => url === active.url ? url : active.url);
                    }
                }
            });
        });
        return () => { authUnsub(); tabUnsubRef.current?.(); };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const addNewTab = useCallback(async (url: string, title = 'New Tab'): Promise<string> => {
        const id = Date.now().toString();
        const newTab: TabItem = { id, title, isActive: true, url };
        setTabs(prev => prev.map(t => ({ ...t, isActive: false })).concat(newTab));
        setActiveTabId(id); setActiveUrl(url);
        await syncNewTab(tabs, newTab);
        return id;
    }, [tabs]);

    const closeTab = useCallback(async (id: string) => {
        // Why: tombstone first — any onSnapshot fired after this point will ignore this tab ID
        closedTabIdsRef.current.add(id);
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
        // Why: debounce so address-bar typing or redirect chains coalesce into a single write
        clearTimeout(navDebounceRef.current);
        navDebounceRef.current = setTimeout(async () => {
            isSyncingRef.current = true;
            await syncNavigate(activeTabId, nextUrl, title);
            // Why: keep lock open briefly so the echo snapshot arrives and is ignored
            setTimeout(() => { isSyncingRef.current = false; }, 600);
        }, NAV_DEBOUNCE_MS);
    }, [activeTabId]);

    return { tabs, setTabs, activeTabId, activeUrl, setActiveUrl, navigateActiveTab, addNewTab, closeTab, selectTab };
};

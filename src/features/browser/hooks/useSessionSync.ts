// Feature: Browser | Trace: src/features/browser/hooks
import { useState, useEffect, useCallback } from 'react';
import { auth } from '../../auth/firebase-config';
import { syncSession, getSession, listenToSession, SessionData } from '../../../../shared/session-sync.service';

/**
 * useSessionSync: Persists browser session (cookies, localStorage)
 * to Firestore for cross-device continuity.
 */
export const useSessionSync = () => {
    const [session, setSession] = useState<SessionData | null>(null);

    useEffect(() => {
        if (!auth.currentUser) return;
        // Hydrate on mount
        getSession(auth.currentUser.uid)
            .then(s => { if (s) setSession(s); })
            .catch(e => console.error('Session hydration failed:', e));

        // Real-time listener for cross-device updates
        const unsubscribe = listenToSession(auth.currentUser.uid, setSession);
        return () => unsubscribe();
    }, [auth.currentUser]);

    const persistSession = useCallback(async (
        data: Omit<SessionData, 'userId'>
    ) => {
        if (!auth.currentUser) return;
        try {
            await syncSession(auth.currentUser.uid, data);
        } catch (e) { console.error('Session persist failed:', e); }
    }, []);

    return { session, persistSession };
};

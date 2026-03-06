// Feature: Auth | Trace: src/features/auth/trace.md
import { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithPopup, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth } from '../firebase-config';

const APP_VERSION = "v1.2.0-DIAGNOSTIC";
sentientLogger.trace("[Auth] Hook initialized. Version:", APP_VERSION);

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setIsLoading(false);
        });
        return unsubscribe;
    }, []);

    const login = async (email: string, pass: string) => {
        setIsLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, pass);
        } finally {
            setIsLoading(false);
        }
    };

    const signup = async (email: string, pass: string) => {
        setIsLoading(true);
        try {
            await createUserWithEmailAndPassword(auth, email, pass);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        await signOut(auth);
        setIsLoading(false);
    };

    const loginWithGoogle = async () => {
        sentientLogger.trace("[Auth] Initiating Google Popup Login...");
        setIsLoading(true);
        try {
            sentientLogger.trace("[Auth] Setting Persistence to LOCAL...");
            await setPersistence(auth, browserLocalPersistence);
            
            sentientLogger.trace("[Auth] Calling signInWithPopup...");
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            sentientLogger.trace("[Auth] Popup Login Success for:", result.user.email);
        } catch (e: any) {
            sentientLogger.error("[Auth] Popup Login Failed:", e);
            // Stringify error object for UI display if needed
            const detailedError = e.code ? `${e.code}: ${e.message}` : JSON.stringify(e);
            const wrapper = new Error(detailedError);
            (wrapper as any).original = e;
            throw wrapper;
        } finally {
            setIsLoading(false);
        }
    };

    return { user, isLoading, login, signup, logout, loginWithGoogle };
};

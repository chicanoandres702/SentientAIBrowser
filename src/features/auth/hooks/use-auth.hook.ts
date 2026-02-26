// Feature: Auth | Trace: src/features/auth/trace.md
import { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase-config';

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

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
        setIsLoading(true);
        const provider = new GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/cloud-platform');

        try {
            const result = await signInWithPopup(auth, provider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            if (credential?.accessToken) {
                setGoogleAccessToken(credential.accessToken);
            }
        } catch (e) {
            console.error(e);
            setIsLoading(false);
        }
    };

    return { user, isLoading, login, signup, logout, loginWithGoogle, googleAccessToken };
};

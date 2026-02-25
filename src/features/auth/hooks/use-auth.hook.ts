// Feature: Auth | Trace: src/features/auth/trace.md
import { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithRedirect, getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase-config';

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Handle successful redirect from Google OAuth
        getRedirectResult(auth)
            .then((result) => {
                if (result) {
                    console.log("Successfully authenticated via redirect");
                }
            })
            .catch((error) => {
                console.error("Redirect Auth Error:", error);
            });

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
        try {
            await signInWithRedirect(auth, provider);
        } catch (e) {
            console.error(e);
            setIsLoading(false);
        }
    };

    return { user, isLoading, login, signup, logout, loginWithGoogle };
};

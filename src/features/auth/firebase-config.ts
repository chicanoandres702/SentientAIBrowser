// Feature: Auth | Trace: src/features/auth/trace.md
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAI, GoogleAIBackend } from "firebase/ai";

// Your web app's Firebase configuration
// These values are public in all web apps and identified the project.
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyBOLfwvlZfE3tVFqX3AbVwP1ef-vR1M4jA",
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "sentient-ai-browser.firebaseapp.com",
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "sentient-ai-browser",
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "sentient-ai-browser.firebasestorage.app",
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "184717935920",
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:184717935920:web:f3810db4ba6755f08a34f5",
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-12D6HTCRD6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const ai = getAI(app, { backend: new GoogleAIBackend() });

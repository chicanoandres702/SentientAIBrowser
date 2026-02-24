// Feature: Auth | Trace: src/features/auth/trace.md
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAI, GoogleAIBackend } from "firebase/ai";

// Your web app's Firebase configuration
// These values are public in all web apps and identified the project.
const firebaseConfig = {
    apiKey: "AIzaSyBOLfwvlZfE3tVFqX3AbVwP1ef-vR1M4jA",
    authDomain: "sentient-ai-browser.firebaseapp.com",
    projectId: "sentient-ai-browser",
    storageBucket: "sentient-ai-browser.firebasestorage.app",
    messagingSenderId: "184717935920",
    appId: "1:184717935920:web:f3810db4ba6755f08a34f5",
    measurementId: "G-12D6HTCRD6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const ai = getAI(app, { backend: new GoogleAIBackend() });

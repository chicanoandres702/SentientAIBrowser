"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ai = exports.db = exports.auth = void 0;
// Feature: Firebase | Trace: shared/firebase.utils.ts
const app_1 = require("firebase/app");
const auth_1 = require("firebase/auth");
const firestore_1 = require("firebase/firestore");
const ai_1 = require("firebase/ai");
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyBOLfwvlZfE3tVFqX3AbVwP1ef-vR1M4jA",
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "studio-3401704068-3986b.firebaseapp.com",
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "studio-3401704068-3986b",
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "studio-3401704068-3986b.firebasestorage.app",
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "184717935920",
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:184717935920:web:f3810db4ba6755f08a34f5",
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-12D6HTCRD6"
};
const app = (0, app_1.getApps)().length === 0 ? (0, app_1.initializeApp)(firebaseConfig) : (0, app_1.getApp)();
exports.auth = (0, auth_1.getAuth)(app);
exports.db = (0, firestore_1.getFirestore)(app);
exports.ai = (0, ai_1.getAI)(app, { backend: new ai_1.GoogleAIBackend() });
//# sourceMappingURL=firebase.utils.js.map
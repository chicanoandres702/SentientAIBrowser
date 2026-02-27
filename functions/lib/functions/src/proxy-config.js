"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PORT = exports.db = void 0;
exports.getBrowser = getBrowser;
exports.stripSecurityHeaders = stripSecurityHeaders;
// Feature: System Utilities | Trace: README.md
const playwright_1 = require("playwright");
const app_1 = require("firebase/app");
const firestore_1 = require("firebase/firestore");
// Hardcoded for simplicity in proxy environment matching App.tsx
// Why: Standardizing fallbacks to match .env for project studio-3401704068-3986b
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
exports.db = (0, firestore_1.getFirestore)(app);
exports.PORT = process.env.PORT || 3000;
let browserInstance = null;
async function getBrowser() {
    if (!browserInstance) {
        browserInstance = await playwright_1.chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    }
    return browserInstance;
}
function stripSecurityHeaders(res) {
    res.removeHeader('X-Frame-Options');
    res.removeHeader('Content-Security-Policy');
    res.removeHeader('Content-Security-Policy-Report-Only');
    res.removeHeader('X-Content-Type-Options');
}
//# sourceMappingURL=proxy-config.js.map
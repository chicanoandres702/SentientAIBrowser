// Feature: System Utilities | Trace: README.md
import { chromium, Browser } from 'playwright';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

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

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db: Firestore = getFirestore(app);

export const PORT = process.env.PORT || 3000;

let browserInstance: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browserInstance) {
    browserInstance = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }
  return browserInstance;
}

export function stripSecurityHeaders(res: any) {
  res.removeHeader('X-Frame-Options');
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('Content-Security-Policy-Report-Only');
  res.removeHeader('X-Content-Type-Options');
}

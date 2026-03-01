// Feature: Auth Config | Trace: README.md
import * as admin from 'firebase-admin';

// Initialize Firebase Admin for the backend
// Why: Standardizing on Admin SDK for all functions/proxy logic to bypass rules.
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "sentient-ai-browser",
    credential: process.env.FIREBASE_SVC_PRIVATE_KEY 
      ? admin.credential.cert({
          projectId: process.env.FIREBASE_SVC_PROJECT_ID,
          clientEmail: process.env.FIREBASE_SVC_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_SVC_PRIVATE_KEY.replace(/\\n/g, '\n'),
        })
      : admin.credential.applicationDefault()
  });
}

export const db = admin.firestore();
export const auth = admin.auth();
export const FieldValue = admin.firestore.FieldValue;

/**
 * Sentient File Header
 * Why: Firebase utility exports for Sentient AI Browser
 * Filepath: functions/src/shared/firebase.utils.ts
 * Description: Exports Firebase db, auth, and FieldValue for use in backend features
 * Trace: Used by backend, mission, and workflow modules
 * Wiring: Exported constants, consumed by backend and mission features
 */
// Feature: Firebase Utilities | Trace: README.md
import { db, auth, FieldValue } from '../auth/firebase-config';

export { auth, db, FieldValue };

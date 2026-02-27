// Feature: System Utilities | Trace: proxy-page-handler.ts
import { BrowserContext } from 'playwright';
import { db } from './proxy-config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export async function loadSession(userId: string): Promise<any> {
  if (!userId || userId === 'default') return undefined;
  try {
    const snap = await getDoc(doc(db, 'user_sessions', userId));
    return snap.exists() ? snap.data().storageState : undefined;
  } catch (e) {
    console.error(`[Session] Load failed for ${userId}:`, (e as Error).message);
    return undefined;
  }
}

export async function saveSession(userId: string, context: BrowserContext) {
  if (!userId || userId === 'default') return;
  try {
    const storageState = await context.storageState();
    await setDoc(doc(db, 'user_sessions', userId), { storageState, updated_at: new Date().toISOString() });
  } catch (e) {
    console.error(`[Session] Save failed for ${userId}:`, (e as Error).message);
  }
}

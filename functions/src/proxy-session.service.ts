// Feature: System Utilities | Trace: proxy-page-handler.ts
import { BrowserContext } from 'playwright';
import { db } from './proxy-config';

export async function loadSession(userId: string): Promise<any> {
  if (!userId || userId === 'default') return undefined;
  try {
    const snap = await db.collection('user_sessions').doc(userId).get();
    return snap.exists ? snap.data()?.storageState : undefined;
  } catch (e) {
    console.error(`[Session] Load failed for ${userId}:`, (e as Error).message);
    return undefined;
  }
}

export async function saveSession(userId: string, context: BrowserContext) {
  if (!userId || userId === 'default') return;
  try {
    const storageState = await context.storageState();
    await db.collection('user_sessions').doc(userId).set({ 
        storageState, 
        updated_at: new Date().toISOString() 
    }, { merge: true });
  } catch (e) {
    console.error(`[Session] Save failed for ${userId}:`, (e as Error).message);
  }
}

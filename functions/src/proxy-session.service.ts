// Feature: System Utilities | Trace: proxy-page-handler.ts
// Why: 3-tier session persistence —
//   Tier 1: in-memory Map  (zero I/O, per-container-instance request)
//   Tier 2: /tmp/sentient-sessions/{userId}.json  (per-user disk path, survives within container)
//   Tier 3: Firestore user_sessions/{userId}  (cross-instance, cross-restart ground truth)
import * as fs from 'fs';
import * as path from 'path';
import { BrowserContext } from 'playwright';
import { db } from './proxy-config';

// Why: /tmp is the only writable directory on Cloud Run and survives for the container lifetime
const SESSION_DIR = '/tmp/sentient-sessions';

// In-memory cache: fastest path, avoids disk I/O for repeated same-container requests
const memCache = new Map<string, object>();

/** Stable, user-scoped file path inside the container */
export function sessionFilePath(userId: string): string {
    return path.join(SESSION_DIR, `${userId}.json`);
}

export async function loadSession(userId: string): Promise<any> {
    if (!userId || userId === 'default') return undefined;

    // Tier 1 — in-memory (same container, no I/O)
    if (memCache.has(userId)) {
        console.log(`[Session] ⚡ In-memory hit for ${userId}`);
        return memCache.get(userId);
    }

    // Tier 2 — local /tmp disk (fast, same container across requests)
    try {
        const filePath = sessionFilePath(userId);
        if (fs.existsSync(filePath)) {
            const state = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            memCache.set(userId, state);
            console.log(`[Session] 📁 Disk hit for ${userId}: ${filePath}`);
            return state;
        }
    } catch { /* fall through to Firestore */ }

    // Tier 3 — Firestore (cold start / new container instance)
    try {
        const snap = await db.collection('user_sessions').doc(userId).get();
        if (!snap.exists) return undefined;
        const state = snap.data()?.storageState;
        if (state) {
            memCache.set(userId, state);
            _writeToDisk(userId, state); // prime local cache for next request
            console.log(`[Session] ☁️ Firestore cold-start restore for ${userId}`);
        }
        return state;
    } catch (e) {
        console.error(`[Session] Load failed for ${userId}:`, (e as Error).message);
        return undefined;
    }
}

export async function saveSession(userId: string, context: BrowserContext) {
    if (!userId || userId === 'default') return;
    try {
        const storageState = await context.storageState();
        memCache.set(userId, storageState);              // Tier 1 — instant
        _writeToDisk(userId, storageState);              // Tier 2 — fast
        await db.collection('user_sessions').doc(userId).set( // Tier 3 — durable
            { storageState, updated_at: new Date().toISOString() },
            { merge: true },
        );
    } catch (e) {
        console.error(`[Session] Save failed for ${userId}:`, (e as Error).message);
    }
}

/** Synchronous disk write — called from hot paths where await would stall. */
function _writeToDisk(userId: string, state: object): void {
    try {
        fs.mkdirSync(SESSION_DIR, { recursive: true });
        fs.writeFileSync(sessionFilePath(userId), JSON.stringify(state));
    } catch { /* non-fatal — Firestore is the durable fallback */ }
}

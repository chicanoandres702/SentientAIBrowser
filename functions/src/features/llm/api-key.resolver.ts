/*
 * [Parent Feature/Milestone] Backend Executor
 * [Child Task/Issue] fix: pass Gemini API key to autonomous executor loop
 * [Subtask] Read user's runtimeGeminiApiKey from Firestore for autonomous execution
 * [Upstream] users/{userId} (Firestore) -> [Downstream] determineNextAction (llm-decision.engine)
 * [Law Check] 25 lines | Passed Do It Check
 */
// Feature: LLM | Why: Resolves the Gemini API key for the backend executor when there
// is no HTTP request context. Reads the user's runtime key stored by Settings > LLM OVERRIDE
// and falls back to server env vars so local dev works without Firestore access.
import { db } from '../../auth/firebase-config';

/**
 * Resolve the Gemini API key for autonomous (non-request) execution.
 * Priority: 1) user's stored key in users/{userId}
 *           2) GOOGLE_API_KEY env var (set on Cloud Run)
 *           3) EXPO_PUBLIC_GEMINI_API_KEY env var (local dev)
 */
export async function resolveGeminiApiKey(userId?: string): Promise<string | undefined> {
    if (userId && userId !== 'anonymous' && userId !== 'default') {
        try {
            const snap = await db.collection('users').doc(userId).get();
            const key: string | undefined = snap.data()?.runtimeGeminiApiKey;
            if (key) return key;
        } catch {
            // Firestore unavailable — fall through to env vars
        }
    }
    return process.env.GOOGLE_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || undefined;
}

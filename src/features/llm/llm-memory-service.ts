// Feature: LLM Memory | Trace: src/features/llm/llm-decision.engine.ts
import { logMissionOutcome, getRelevantOutcomes, MissionOutcome } from '../../utils/browser-sync-service';
import { db } from '../auth/firebase-config';
import { collection, addDoc, serverTimestamp, query, where, limit, getDocs } from 'firebase/firestore';

/**
 * Why: This service handles the "Learning" loop, allowing the AI to 
 * avoid previous mistakes and repeat successes.
 */
export const recordActionOutcome = async (
    userId: string, 
    goal: string, 
    action: string, 
    result: 'success' | 'failure',
    observation: string,
    domain?: string
) => {
    const outcome: MissionOutcome = {
        id: Math.random().toString(36).substr(2, 9),
        userId,
        goal,
        action,
        result,
        observation,
        timestamp: Date.now()
    };

    await logMissionOutcome(outcome);
    
    // Check if this is a universal tool (e.g. Google Docs, MS Word)
    const isUniversalTool = domain && (
        domain.includes('docs.google.com') || 
        domain.includes('office.com') || 
        domain.includes('word.live.com')
    );

    // Sync navigation patterns to global knowledge ONLY for universal tools
    if (result === 'success' && isUniversalTool) {
        const globalRef = collection(db, 'global_knowledge');
        const redact = (str: string) => str
            .replace(/[0-9]/g, '#')
            .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
            .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]');

        await addDoc(globalRef, {
            goalPattern: redact(goal.toLowerCase()),
            action,
            observation: redact(observation),
            tool: domain,
            updated_at: serverTimestamp()
        });
    }
};

export const getLessonsLearned = async (userId: string, goal: string): Promise<string> => {
    const outcomes = await getRelevantOutcomes(userId, goal);
    if (!outcomes || outcomes.length === 0) return "No prior experience for this goal.";

    const successes = outcomes.filter(o => o.result === 'success').map(o => o.action).join(', ');
    const failures = outcomes.filter(o => o.result === 'failure').map(o => o.action).join(', ');

    return `
### HISTORICAL LESSONS:
- **Successful Actions**: ${successes || 'None yet'}
- **Failed Actions (Avoid these)**: ${failures || 'None yet'}
    `.trim();
};

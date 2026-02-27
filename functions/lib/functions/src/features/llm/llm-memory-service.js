"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLessonsLearned = exports.recordActionOutcome = void 0;
// Feature: LLM Memory | Trace: src/features/llm/llm-decision.engine.ts
const outcome_sync_service_1 = require("../../shared/outcome-sync.service");
const firebase_config_1 = require("../../auth/firebase-config");
const firestore_1 = require("firebase/firestore");
/**
 * Why: This service handles the "Learning" loop, allowing the AI to
 * avoid previous mistakes and repeat successes.
 */
const recordActionOutcome = async (userId, goal, action, result, observation, domain) => {
    const outcome = {
        id: Math.random().toString(36).substr(2, 9),
        userId,
        goal,
        action,
        result,
        observation,
        timestamp: Date.now()
    };
    await (0, outcome_sync_service_1.logMissionOutcome)(outcome);
    // Check if this is a universal tool (e.g. Google Docs, MS Word)
    const isUniversalTool = domain && (domain.includes('docs.google.com') ||
        domain.includes('office.com') ||
        domain.includes('word.live.com'));
    // Sync navigation patterns to global knowledge ONLY for universal tools
    if (result === 'success' && isUniversalTool) {
        const globalRef = (0, firestore_1.collection)(firebase_config_1.db, 'global_knowledge');
        const redact = (str) => str
            .replace(/[0-9]/g, '#')
            .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
            .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]');
        await (0, firestore_1.addDoc)(globalRef, {
            goalPattern: redact(goal.toLowerCase()),
            action,
            observation: redact(observation),
            tool: domain,
            updated_at: (0, firestore_1.serverTimestamp)()
        });
    }
};
exports.recordActionOutcome = recordActionOutcome;
const getLessonsLearned = async (userId, goal) => {
    const outcomes = await (0, outcome_sync_service_1.getRelevantOutcomes)(userId, goal);
    if (!outcomes || outcomes.length === 0)
        return "No prior experience for this goal.";
    const successes = outcomes.filter(o => o.result === 'success').map(o => o.action).join(', ');
    const failures = outcomes.filter(o => o.result === 'failure').map(o => o.action).join(', ');
    return `
### HISTORICAL LESSONS:
- **Successful Actions**: ${successes || 'None yet'}
- **Failed Actions (Avoid these)**: ${failures || 'None yet'}
    `.trim();
};
exports.getLessonsLearned = getLessonsLearned;
//# sourceMappingURL=llm-memory-service.js.map
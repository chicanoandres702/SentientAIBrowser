// Feature: DOM Actions | Why: Isolate side effects to keep action execution deterministic
import { recordAnswer } from '../../../shared/survey-memory-db';
import { saveContextualKnowledge } from '../llm/knowledge-hierarchy.service';
import { auth } from '../auth/firebase-config';

interface SideEffectContext {
    activePrompt: string;
    activeUrl: string;
    setStatusMessage: (m: string) => void;
}

interface SideEffectStep {
    action?: string;
    value?: string;
    knowledgeContext?: Record<string, unknown>;
}

export const runSideEffects = async (step: SideEffectStep, ctx: SideEffectContext): Promise<void> => {
    if (step.action === 'type' && step.value) {
        await recordAnswer(ctx.activePrompt, step.value);
        return;
    }
    if (step.action === 'record_knowledge' && step.value) {
        ctx.setStatusMessage('Saving Brain Data...');
        await saveContextualKnowledge(
            auth.currentUser?.uid || 'anonymous',
            { contextId: new URL(ctx.activeUrl).hostname, ...(step.knowledgeContext || {}) },
            'rule',
            step.value,
        );
    }
};

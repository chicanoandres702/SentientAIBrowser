// Feature: Core | Why: Extracts action execution from DOM decision — handles click/type/wait/done/ask_user
import { HeadlessWebViewRef } from '../components/HeadlessWebView';
import { recordAnswer } from '../../shared/survey-memory-db';
import { saveContextualKnowledge } from '../features/llm/knowledge-hierarchy.service';
import { auth } from '../features/auth/firebase-config';

interface ActionContext {
    activePrompt: string;
    activeUrl: string;
    webViewRef: React.RefObject<HeadlessWebViewRef>;
    setStatusMessage: (m: string) => void;
    setIsPaused: (p: boolean) => void;
    setBlockedReason: (r: string) => void;
    setIsBlockedModalVisible: (v: boolean) => void;
    setInteractiveRequest: (req: { question: string; type: 'confirm' | 'input' } | null) => void;
    setIsInteractiveModalVisible: (v: boolean) => void;
}

/**
 * Executes a single decision step from the cloud LLM response.
 * Returns true if an action was executed, false otherwise.
 */
export const executeDomAction = async (
    step: any,
    ctx: ActionContext,
): Promise<boolean> => {
    // Login detection (handled at decision level, but kept here for defensive coding)
    if (step.action === 'ask_user' && step.value) {
        ctx.setInteractiveRequest({ question: step.value, type: step.value.includes('?') ? 'confirm' : 'input' });
        ctx.setIsInteractiveModalVisible(true);
        ctx.setIsPaused(true);
        ctx.setStatusMessage('Awaiting Input');
        return false;
    }

    if (step.action === 'lookup_documentation' && step.value) {
        ctx.setStatusMessage('Docs lookup disabled');
        return false;
    }

    if (step.action === 'type' && step.value) {
        await recordAnswer(ctx.activePrompt, step.value);
    }

    if (step.action === 'record_knowledge' && step.value) {
        ctx.setStatusMessage('Saving Brain Data...');
        const targetContext = {
            contextId: new URL(ctx.activeUrl).hostname,
            ...(step.knowledgeContext || {}),
        };
        await saveContextualKnowledge(
            auth.currentUser?.uid || 'anonymous',
            targetContext,
            'rule',
            step.value,
        );
    }

    if (step.targetId) {
        ctx.setStatusMessage(`Executing: ${step.action}...`);
        ctx.webViewRef.current?.executeAction(step.action as any, step.targetId, step.value);
        return true;
    }

    if (step.action === 'wait') {
        ctx.setStatusMessage('Waiting...');
        await new Promise(r => setTimeout(r, 2000));
        return true;
    }

    if (step.action === 'done') {
        ctx.setStatusMessage('Task Complete');
        return true;
    }

    return false;
};

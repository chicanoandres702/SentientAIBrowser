// Feature: Core | Why: Strategy-map dispatch for DOM actions — cursor-first execution path
// Animates virtual cursor to target BEFORE dispatching WebView action
import { HeadlessWebViewRef } from '../components/HeadlessWebView';
import { recordAnswer } from '../../shared/survey-memory-db';
import { saveContextualKnowledge } from '../features/llm/knowledge-hierarchy.service';
import { auth } from '../features/auth/firebase-config';

/** Cursor animation callbacks — optional, gracefully degrades without cursor */
export interface CursorActions {
    animateClick: (targetId: string) => Promise<boolean>;
    animateType: (targetId: string) => Promise<boolean>;
    hideCursor: () => void;
}

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
    cursorActions?: CursorActions;
}

/** Pre-action side effects keyed by action type — O(1) lookup replaces if/else chain */
const SIDE_EFFECTS: Record<string, (s: any, c: ActionContext) => Promise<void>> = {
    type: async (s, c) => { if (s.value) await recordAnswer(c.activePrompt, s.value); },
    record_knowledge: async (s, c) => {
        if (!s.value) return;
        c.setStatusMessage('Saving Brain Data...');
        await saveContextualKnowledge(
            auth.currentUser?.uid || 'anonymous',
            { contextId: new URL(c.activeUrl).hostname, ...(s.knowledgeContext || {}) },
            'rule', s.value,
        );
    },
};

/** Execute a single LLM decision step. Returns true if an action ran. */
export const executeDomAction = async (step: any, ctx: ActionContext): Promise<boolean> => {
    // Terminal: interactive prompt pauses execution for user input
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

    // O(1) side-effect lookup before main action
    await SIDE_EFFECTS[step.action]?.(step, ctx);

    if (step.targetId) {
        ctx.setStatusMessage(`Executing: ${step.action}...`);

        // Cursor-first: animate pseudo-cursor to target before dispatching action
        if (ctx.cursorActions) {
            const isTypeAction = step.action === 'type';
            const animated = isTypeAction
                ? await ctx.cursorActions.animateType(step.targetId)
                : await ctx.cursorActions.animateClick(step.targetId);
            if (!animated) {
                ctx.setStatusMessage(`Cursor: target ${step.targetId} not found in DOM map`);
            }
        }

        ctx.webViewRef.current?.executeAction(step.action as any, step.targetId, step.value);
        return true;
    }
    if (step.action === 'wait') {
        ctx.setStatusMessage('Waiting...');
        ctx.cursorActions?.hideCursor();
        await new Promise(r => setTimeout(r, 2000));
        return true;
    }
    if (step.action === 'done') {
        ctx.setStatusMessage('Task Complete');
        ctx.cursorActions?.hideCursor();
        return true;
    }
    return false;
};

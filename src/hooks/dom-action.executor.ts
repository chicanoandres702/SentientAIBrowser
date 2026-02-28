// Feature: Core | Why: Strategy-map dispatch for DOM actions — cursor-first execution path
// Animates virtual cursor to target BEFORE dispatching WebView action
import { HeadlessWebViewRef } from '../components/HeadlessWebView';
import { normalizeStep } from '../features/dom-actions/dom-action.normalizer';
import { runSideEffects } from '../features/dom-actions/dom-action.side-effects';

/** Cursor animation callbacks — optional, gracefully degrades without cursor */
export interface CursorActions {
    animateClick: (targetId: string) => Promise<boolean>;
    animateType: (targetId: string) => Promise<boolean>;
    hideCursor: () => void;
}

export interface RemoteActions {
    executeAction: (action: 'click' | 'type', targetId: string, value?: string) => Promise<void>;
}

interface ActionContext {
    activePrompt: string;
    activeUrl: string;
    webViewRef: React.RefObject<HeadlessWebViewRef>;
    /** Why: use navigateActiveTab (syncs Firestore) so the tab listener never reverts the URL */
    navigateActiveTab?: (url: string) => Promise<void>;
    setActiveUrl?: (url: string) => void;
    setStatusMessage: (m: string) => void;
    setIsPaused: (p: boolean) => void;
    setBlockedReason: (r: string) => void;
    setIsBlockedModalVisible: (v: boolean) => void;
    setInteractiveRequest: (req: { question: string; type: 'confirm' | 'input' } | null) => void;
    setIsInteractiveModalVisible: (v: boolean) => void;
    cursorActions?: CursorActions;
    remoteActions?: RemoteActions;
}

/** Execute a single LLM decision step. Returns true if an action ran. */
export const executeDomAction = async (rawStep: any, ctx: ActionContext): Promise<boolean> => {
    const step = normalizeStep(rawStep);
    const action = step.action;
    // Terminal: interactive prompt pauses execution for user input
    if (action === 'ask_user' && step.value) {
        ctx.setInteractiveRequest({ question: step.value, type: step.value.includes('?') ? 'confirm' : 'input' });
        ctx.setIsInteractiveModalVisible(true);
        ctx.setIsPaused(true);
        ctx.setStatusMessage('Awaiting Input');
        return false;
    }
    if (action === 'wait_for_user') {
        ctx.setIsPaused(true);
        ctx.setStatusMessage('Awaiting User');
        return false;
    }
    if (action === 'navigate' && step.value) {
        ctx.setStatusMessage('Navigating...');
        // Sync to Firestore first; plain setActiveUrl would be overwritten by the tab listener
        if (ctx.navigateActiveTab) { await ctx.navigateActiveTab(step.value); }
        else { ctx.setActiveUrl?.(step.value); }
        return true;
    }
    if (action === 'scan_dom') {
        ctx.webViewRef.current?.scanDOM();
        ctx.setStatusMessage('Scanning DOM...');
        return true;
    }
    if (action === 'lookup_documentation' && step.value) {
        ctx.setStatusMessage('Docs lookup disabled');
        return false;
    }
    await runSideEffects(step, ctx);

    if (step.targetId) {
        ctx.setStatusMessage(`Executing: ${action}...`);

        // Cursor-first: animate pseudo-cursor to target before dispatching action
        if (ctx.cursorActions) {
            const isTypeAction = action === 'type';
            const animated = isTypeAction
                ? await ctx.cursorActions.animateType(step.targetId)
                : await ctx.cursorActions.animateClick(step.targetId);
            if (!animated) {
                ctx.setStatusMessage(`Cursor: target ${step.targetId} not found in DOM map`);
            }
        }

        if (ctx.remoteActions) {
            if (action === 'click' || action === 'type') {
                await ctx.remoteActions.executeAction(action, step.targetId, step.value);
            } else {
                ctx.setStatusMessage(`Remote action unsupported: ${action}`);
                return false;
            }
        } else {
            ctx.webViewRef.current?.executeAction(action as any, step.targetId, step.value);
        }
        return true;
    }
    if (action === 'verify' || action === 'extract_data') {
        ctx.webViewRef.current?.scanDOM();
        ctx.setStatusMessage('Verifying...');
        return true;
    }
    if (action === 'wait') {
        ctx.setStatusMessage('Waiting...');
        ctx.cursorActions?.hideCursor();
        await new Promise(r => setTimeout(r, 2000));
        return true;
    }
    if (action === 'done') {
        ctx.setStatusMessage('Task Complete');
        ctx.cursorActions?.hideCursor();
        return true;
    }
    return false;
};

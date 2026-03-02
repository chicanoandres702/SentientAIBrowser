// Feature: Core | Why: Strategy-map dispatch for DOM actions — cursor-first execution path
// Animates virtual cursor to target BEFORE dispatching WebView action
import { HeadlessWebViewRef } from '../features/browser';
import { normalizeStep } from '../features/dom-actions/dom-action.normalizer';
import { runSideEffects } from '../features/dom-actions/dom-action.side-effects';
import { dispatchWithTargetId, dispatchWithAria } from './dom-action.dispatch';

/** Cursor animation callbacks — optional, gracefully degrades without cursor */
export interface CursorActions {
    animateClick: (targetId: string) => Promise<boolean>;
    animateType: (targetId: string) => Promise<boolean>;
    hideCursor: () => void;
}

/** ARIA selector fields for remote Playwright dispatch */
export interface AriaSelector {
    role?: string;
    name?: string;
    text?: string;
}

export interface RemoteActions {
    executeAction: (action: 'click' | 'type', targetId: string | undefined, value?: string, ariaSelector?: AriaSelector) => Promise<void>;
}

export interface ActionContext {
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
    // Why: ref stays current inside stale async closures — state snapshots don't
    isPausedRef?: { current: boolean };
}

/** Execute a single LLM decision step. Returns true if an action ran. */
export const executeDomAction = async (rawStep: any, ctx: ActionContext): Promise<boolean> => {
    // Why: check ref not closure — user may have paused after this call was queued
    if (ctx.isPausedRef?.current) { console.debug('[Executor] ⏸️  skip — paused at entry'); return false; }
    const step = normalizeStep(rawStep);
    const action = step.action;
    console.log(`[Executor] 🎮 action=${action} targetId=${step.targetId ?? '-'} value=${String(step.value ?? '').substring(0, 60)}`);
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
        console.log(`[Executor] 🔗 navigate → ${step.value}`);
        ctx.setStatusMessage('Navigating...');
        // Sync to Firestore first; plain setActiveUrl would be overwritten by the tab listener
        ctx.setActiveUrl?.(step.value);
        if (ctx.navigateActiveTab) { await ctx.navigateActiveTab(step.value); }
        else { ctx.setActiveUrl?.(step.value); }
        return true;
    }
    if (action === 'scan_dom') {
        console.debug('[Executor] 🔎 scan_dom triggered');
        ctx.webViewRef.current?.scanDOM();
        ctx.setStatusMessage('Scanning DOM...');
        return true;
    }
    if (action === 'lookup_documentation' && step.value) {
        ctx.setStatusMessage('Docs lookup disabled');
        return false;
    }
    await runSideEffects(step, ctx);

    if (step.targetId) return dispatchWithTargetId(action, step as any, ctx);
    const hasAriaSelector = !!(step.role || step.name || step.text);
    if (hasAriaSelector && (action === 'click' || action === 'type')) return dispatchWithAria(action, step, ctx);
    if (action === 'verify' || action === 'extract_data') {
        ctx.webViewRef.current?.scanDOM();
        ctx.setStatusMessage('Verifying...');
        return true;
    }
    if (action === 'wait') {
        console.debug('[Executor] ⏳ wait 2s');
        ctx.setStatusMessage('Waiting...');
        ctx.cursorActions?.hideCursor();
        await new Promise(r => setTimeout(r, 2000));
        return true;
    }
    if (action === 'done') {
        console.log('[Executor] ✅ done — task complete');
        ctx.setStatusMessage('Task Complete');
        ctx.cursorActions?.hideCursor();
        return true;
    }
    console.warn(`[Executor] ⚠️  unhandled action=${action} — no handler matched`);
    return false;
};

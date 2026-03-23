// Feature: Core | Why: Strategy-map dispatch for DOM actions — cursor-first execution path
// Animates virtual cursor to target BEFORE dispatching WebView action
import { HeadlessWebViewRef } from '../features/browser';
import { normalizeStep } from '../features/dom-actions/dom-action.normalizer';
import { runSideEffects } from '../features/dom-actions/dom-action.side-effects';
import { dispatchWithTargetId, dispatchWithAria } from './dom-action.dispatch';
import { handleInteractivePrompt } from './dom-action.interactive';
import { handleNavigationAction } from './dom-action.navigation';
import { handleDomScanActions } from './dom-action.domscan';
import { handleMiscActions } from './dom-action.misc';

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
    if (ctx.isPausedRef?.current) { console.debug('[Executor] ⏸️  skip — paused at entry'); return false; }
    const step = normalizeStep(rawStep);
    const action = step.action;
    console.log(`[Executor] 🎮 action=${action} targetId=${step.targetId ?? '-'} value=${String(step.value ?? '').substring(0, 60)}`);

    // Interactive prompt actions
    const interactiveResult = handleInteractivePrompt(action, step, ctx);
    if (interactiveResult !== null) return interactiveResult;

    // Navigation actions
    const navigationResult = await handleNavigationAction(action, step, ctx);
    if (navigationResult !== null) return navigationResult;

    // DOM scan and verification actions
    const domScanResult = handleDomScanActions(action, step, ctx);
    if (domScanResult !== null) return domScanResult;

    // Misc actions (wait, done)
    const miscResult = await handleMiscActions(action, ctx);
    if (miscResult !== null) return miscResult;

    if (action === 'lookup_documentation' && step.value) {
        ctx.setStatusMessage('Docs lookup disabled');
        return false;
    }
    await runSideEffects(step, ctx);

    if (step.targetId) return dispatchWithTargetId(action, step as any, ctx);
    const hasAriaSelector = !!(step.role || step.name || step.text);
    if (hasAriaSelector && (action === 'click' || action === 'type')) return dispatchWithAria(action, step, ctx);

    console.warn(`[Executor] ⚠️  unhandled action=${action} — no handler matched`);
    return false;
};

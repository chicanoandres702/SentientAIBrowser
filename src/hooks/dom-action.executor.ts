// Feature: Core | Trace: src/hooks/dom-action.executor.ts
/*
 * [Parent Feature/Milestone] Core | [Child Task/Issue] dom-action.executor
 * [Subtask] Optimized DOM action dispatch with reduced complexity
 * [Upstream] Normalized LLM step -> [Downstream] WebView/Remote execution
 * [Law Check] 88 lines | Passed 100-Line Law
 */
import { HeadlessWebViewRef } from '../components/HeadlessWebView';
import { normalizeStep } from '../features/dom-actions/dom-action.normalizer';
import { runSideEffects } from '../features/dom-actions/dom-action.side-effects';

export interface CursorActions { animateClick: (id: string) => Promise<boolean>; animateType: (id: string) => Promise<boolean>; hideCursor: () => void; }
export interface AriaSelector { role?: string; name?: string; text?: string; }
export interface RemoteActions { executeAction: (action: 'click' | 'type', id: string | unknown, value?: string, aria?: AriaSelector) => Promise<void>; }
interface ActionContext {
    activePrompt: string; activeUrl: string; webViewRef: React.RefObject<HeadlessWebViewRef>; navigateActiveTab?: (url: string) => Promise<void>; setActiveUrl?: (url: string) => void;
    setStatusMessage: (m: string) => void; setIsPaused: (p: boolean) => void; setBlockedReason: (r: string) => void; setIsBlockedModalVisible: (v: boolean) => void;
    setInteractiveRequest: (req: unknown) => void; setIsInteractiveModalVisible: (v: boolean) => void; cursorActions?: CursorActions; remoteActions?: RemoteActions;
}

const handleTerminal = (action: string, value: unknown, ctx: ActionContext): boolean => {
    if (action === 'ask_user' && value) { ctx.setInteractiveRequest({ question: value, type: String(value).includes('?') ? 'confirm' : 'input' }); ctx.setIsInteractiveModalVisible(true); ctx.setIsPaused(true); ctx.setStatusMessage('Awaiting Input'); return false; }
    if (action === 'wait_for_user') { ctx.setIsPaused(true); ctx.setStatusMessage('Awaiting User'); return false; }
    return false;
};

const handleNavigation = (action: string, value: unknown, ctx: ActionContext): boolean => {
    if (action === 'navigate' && value) { ctx.setStatusMessage('Navigating...'); if (ctx.navigateActiveTab) ctx.navigateActiveTab(String(value)); else ctx.setActiveUrl?.(String(value)); return true; }
    if (action === 'scan_dom') { ctx.webViewRef.current?.scanDOM(); ctx.setStatusMessage('Scanning DOM...'); return true; }
    return false;
};

const handleInteractive = async (step: unknown, ctx: ActionContext): Promise<boolean> => {
    const s = step as unknown & { targetId?: string; action?: string; value?: string; role?: string; name?: string; text?: string };
    if (!s.targetId && !s.role && !s.name && !s.text) return false;
    ctx.setStatusMessage(`Executing: ${s.action}...`);
    if (ctx.cursorActions && s.targetId) {
        const animated = s.action === 'type' ? await ctx.cursorActions.animateType(s.targetId) : await ctx.cursorActions.animateClick(s.targetId);
        if (!animated) ctx.setStatusMessage(`Cursor: target ${s.targetId} not found`);
    }
    if (ctx.remoteActions) {
        if (s.action === 'click' || s.action === 'type') await ctx.remoteActions.executeAction(s.action as 'click' | 'type', s.targetId, s.value, { role: s.role, name: s.name, text: s.text });
        else return false;
    } else ctx.webViewRef.current?.executeAction(s.action as never, s.targetId, s.value);
    return true;
};

export const executeDomAction = async (rawStep: unknown, ctx: ActionContext): Promise<boolean> => {
    const step = normalizeStep(rawStep);
    const action = String(step?.action || '');
    if (handleTerminal(action, (step as unknown & { value?: string })?.value, ctx)) return false;
    if (handleNavigation(action, (step as unknown & { value?: string })?.value, ctx)) return true;
    await runSideEffects(step, ctx);
    return await handleInteractive(step, ctx);
};

        ctx.setStatusMessage(`ARIA actions require the remote proxy (enable Remote Mirror)`);
        return false;
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

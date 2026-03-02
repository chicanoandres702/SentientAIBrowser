// Feature: Core | Why: Cursor-first dispatch helpers — targetId and ARIA selector execution paths
import type { ActionContext } from './dom-action.executor';

/** Dispatches cursor-animated action to a DOM element by targetId. Returns true if an action ran. */
export const dispatchWithTargetId = async (
    action: string,
    step: { targetId: string; value?: string },
    ctx: ActionContext,
): Promise<boolean> => {
    ctx.setStatusMessage(`Executing: ${action}...`);
    if (ctx.cursorActions) {
        const animated = action === 'type'
            ? await ctx.cursorActions.animateType(step.targetId)
            : await ctx.cursorActions.animateClick(step.targetId);
        if (!animated) ctx.setStatusMessage(`Cursor: target ${step.targetId} not found in DOM map`);
    }
    if (ctx.remoteActions) {
        if (action === 'click' || action === 'type') {
            await ctx.remoteActions.executeAction(action, step.targetId, step.value);
        } else {
            ctx.setStatusMessage(`Remote action unsupported: ${action}`);
            return false;
        }
    } else {
        ctx.webViewRef.current?.executeAction(action as 'click' | 'type', step.targetId, step.value);
    }
    return true;
};

/** Dispatches action resolved via ARIA locator (Playwright MCP format). Returns true if an action ran. */
export const dispatchWithAria = async (
    action: 'click' | 'type',
    step: { value?: string; role?: string; name?: string; text?: string },
    ctx: ActionContext,
): Promise<boolean> => {
    ctx.setStatusMessage(`Executing: ${action} (ARIA)...`);
    if (ctx.remoteActions) {
        await ctx.remoteActions.executeAction(action, undefined, step.value, { role: step.role, name: step.name, text: step.text });
        return true;
    }
    ctx.setStatusMessage('ARIA actions require the remote proxy (enable Remote Mirror)');
    return false;
};

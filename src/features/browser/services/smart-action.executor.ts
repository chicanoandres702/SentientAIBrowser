// Feature: Browser | Why: Smart action execution with overlay recovery — web-ui-1's smart_click pattern
// Retries failed actions after clearing overlays, with exponential backoff

import { HeadlessWebViewRef } from '@features/browser';
import { VIEW_CLEARING_STAGES } from './view-clearing.pipeline';

interface SmartActionContext {
    webViewRef: React.RefObject<HeadlessWebViewRef>;
    setStatusMessage: (m: string) => void;
}

interface ActionStep {
    action: string;
    targetId?: string;
    value?: string;
    explanation: string;
}

/** Execute a DOM action with retry + overlay clearing on failure */
export const executeWithRetry = async (
    step: ActionStep,
    ctx: SmartActionContext,
    maxRetries: number = 3,
): Promise<{ success: boolean; attempts: number; error?: string }> => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            if (attempt > 0) {
                ctx.setStatusMessage(`Retry ${attempt}/${maxRetries}: clearing overlays...`);
                await clearViewBeforeRetry(ctx.webViewRef);
                // Exponential backoff: 500ms, 1000ms, 2000ms
                await sleep(500 * Math.pow(2, attempt - 1));
            }

            ctx.setStatusMessage(`Executing: ${step.action}${step.targetId ? ` → ${step.targetId}` : ''}`);

            if (step.targetId) {
                ctx.webViewRef.current?.executeAction(step.action as any, step.targetId, step.value);
                return { success: true, attempts: attempt + 1 };
            }
            if (step.action === 'wait') {
                await sleep(2000);
                return { success: true, attempts: attempt + 1 };
            }
            if (step.action === 'done') {
                ctx.setStatusMessage('Task Complete');
                return { success: true, attempts: attempt + 1 };
            }
            // No target and not a known action — can't execute
            return { success: false, attempts: attempt + 1, error: 'No targetId for action' };
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            // Only retry on overlay interception errors
            if (isOverlayError(msg) && attempt < maxRetries - 1) continue;
            return { success: false, attempts: attempt + 1, error: msg };
        }
    }
    return { success: false, attempts: maxRetries, error: 'Max retries exceeded' };
};

/** Run view clearing stages 1-4 via WebView JS injection */
const clearViewBeforeRetry = async (
    webViewRef: React.RefObject<HeadlessWebViewRef>,
): Promise<void> => {
    // Execute first 4 stages (skip detect — that's diagnostic only)
    for (const stage of VIEW_CLEARING_STAGES.slice(0, 4)) {
        try {
            webViewRef.current?.injectJavaScript?.(stage.script);
            await sleep(200);
        } catch {
            // Best-effort — continue even if a stage fails
        }
    }
};

/** Detect overlay-related errors that warrant a retry */
const isOverlayError = (msg: string): boolean => {
    const lower = msg.toLowerCase();
    return lower.includes('intercept') || lower.includes('overlay')
        || lower.includes('not clickable') || lower.includes('obscured')
        || lower.includes('stale element');
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

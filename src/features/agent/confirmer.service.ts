// Feature: Agent | Why: Secondary LLM validation before execution — web-ui-1's confirmer_llm pattern
// Prevents costly mistakes by having a lightweight LLM verify the decision before action

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ConfirmerResult {
    confirmed: boolean;
    reason: string;
    suggestedAction?: string;
}

/** Strictness levels map to prompt depth — web-ui-1 uses 1-10 scale */
export type StrictnessLevel = 'fast' | 'standard' | 'thorough';

const FAST_PROMPT = `You are a quick validation assistant. Given the agent's planned action and context, reply with ONLY "YES" or "NO" followed by a brief reason.`;

const STANDARD_PROMPT = `You are an action validation assistant. Analyze whether the planned action is correct and safe.
Consider:
1. Does the action match the stated goal?
2. Is the target element appropriate?
3. Could this action cause unintended side effects (e.g., submitting a form prematurely)?
4. Is there a CAPTCHA, login wall, or overlay that should be handled first?

Reply format: YES|NO - [reason]
If NO, suggest an alternative action.`;

const THOROUGH_PROMPT = `You are a meticulous action validator. Perform deep analysis:
1. Goal alignment — does this action advance the user's objective?
2. Page state — is the page ready for this action (loaded, no blockers)?
3. Element verification — does the DOM context match the target?
4. Sequence logic — is this the right step in the plan order?
5. Risk assessment — could this action trigger irreversible changes?
6. Alternative check — is there a better/safer action?

Reply: YES|NO - [detailed reason]
If NO, include SUGGESTED_ACTION: [alternative]`;

/** Validate an agent decision before execution */
export const confirmAction = async (
    action: string,
    targetContext: string,
    goal: string,
    currentUrl: string,
    strictness: StrictnessLevel = 'fast',
): Promise<ConfirmerResult> => {
    const prompt = strictness === 'fast' ? FAST_PROMPT
        : strictness === 'thorough' ? THOROUGH_PROMPT
        : STANDARD_PROMPT;

    const userMsg = `Goal: ${goal}\nURL: ${currentUrl}\nPlanned Action: ${action}\nTarget: ${targetContext}`;

    try {
        const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY || '');
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent(`${prompt}\n\n${userMsg}`);
        const text = result.response.text().trim();

        const confirmed = text.toUpperCase().startsWith('YES');
        const reason = text.replace(/^(YES|NO)\s*[-:]?\s*/i, '').trim();

        // Extract suggested action if present
        const sugMatch = reason.match(/SUGGESTED_ACTION:\s*(.+)/i);
        return {
            confirmed,
            reason: reason.replace(/SUGGESTED_ACTION:.+/i, '').trim(),
            suggestedAction: sugMatch?.[1]?.trim(),
        };
    } catch (e) {
        // On confirmer failure, allow the action — don't block on validation errors
        console.warn('[Confirmer] Validation failed, allowing action:', e);
        return { confirmed: true, reason: 'Confirmer unavailable — auto-approved' };
    }
};

/** Quick check: should we even bother confirming? Skip low-risk actions */
export const shouldConfirm = (action: string): boolean => {
    const LOW_RISK = ['wait', 'scroll_down', 'scroll_up', 'done', 'take_screenshot'];
    return !LOW_RISK.includes(action);
};

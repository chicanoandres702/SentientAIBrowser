// Feature: Agent | Why: Register core browser actions into the action registry — web-ui-1's Mixin pattern
// Separated from registry to keep each file focused and under 100 lines

import { actionRegistry, ActionParams, ActionResult } from './action-registry.service';

/** Navigation actions — from web-ui-1's NavigationActionsMixin */
export const registerNavigationActions = (): void => {
    actionRegistry.register({
        name: 'click', category: 'navigation', requiresTarget: true,
        description: 'Click a DOM element by AI target ID',
        handler: async (p) => ({ success: true, message: `Click → ${p.targetId}` }),
    });
    actionRegistry.register({
        name: 'type', category: 'interaction', requiresTarget: true,
        description: 'Type text into a form field by AI target ID',
        handler: async (p) => ({ success: true, message: `Type "${p.value}" → ${p.targetId}` }),
    });
    actionRegistry.register({
        name: 'navigate', category: 'navigation', requiresTarget: false,
        description: 'Navigate to a URL',
        handler: async (p) => ({ success: !!p.url, message: `Navigate → ${p.url || 'no URL'}` }),
    });
    actionRegistry.register({
        name: 'wait', category: 'system', requiresTarget: false,
        description: 'Wait for page content to stabilize',
        handler: async () => { await sleep(2000); return { success: true, message: 'Waited 2s' }; },
    });
    actionRegistry.register({
        name: 'done', category: 'system', requiresTarget: false,
        description: 'Signal task completion',
        handler: async () => ({ success: true, message: 'Task complete' }),
    });
};

/**
 * Async callback type for the ask_user interactive pause.
 * Technique: browser-use/web-ui custom_controller.py — ask_for_assistant with coroutine support.
 * The callback receives the agent's query and resolves with the human's response string.
 */
export type AskAssistantCallback = (query: string) => Promise<string>;

/** Interaction actions — from web-ui-1's InteractionActionsMixin */
export const registerInteractionActions = (
    /** Optional: supply a callback so ask_user actually waits for a real human reply */
    askAssistantCallback?: AskAssistantCallback
): void => {
    actionRegistry.register({
        name: 'ask_user', category: 'user', requiresTarget: false,
        description: 'Pause execution and request input or confirmation from the human',
        handler: async (p): Promise<ActionResult> => {
            const query = p.value || p.extra?.query as string || 'Agent needs assistance';
            if (askAssistantCallback) {
                // --- browser-use/web-ui: block until callback resolves with human reply ---
                const reply = await askAssistantCallback(query);
                return { success: true, message: `AI ask: ${query}. User response: ${reply}`, data: reply };
            }
            // Fallback: fire-and-forget (existing behaviour — surface to UI via state)
            return { success: true, message: `Asking: ${query}` };
        },
    });
    actionRegistry.register({
        name: 'scroll_down', category: 'navigation', requiresTarget: false,
        description: 'Scroll page down to reveal more content',
        handler: async () => ({ success: true, message: 'Scrolled down' }),
    });
    actionRegistry.register({
        name: 'scroll_up', category: 'navigation', requiresTarget: false,
        description: 'Scroll page up',
        handler: async () => ({ success: true, message: 'Scrolled up' }),
    });

    // --- browser-use/web-ui: upload_file action (custom_controller.py) ---
    actionRegistry.register({
        name: 'upload_file', category: 'interaction', requiresTarget: true,
        description: 'Upload a local file to a file-input element by AI target ID',
        handler: async (p): Promise<ActionResult> => {
            const filePath = p.extra?.filePath as string | undefined;
            if (!filePath) return { success: false, message: 'upload_file requires extra.filePath' };
            // Validate allowed extensions to prevent arbitrary uploads
            const allowed = ['.pdf', '.png', '.jpg', '.jpeg', '.csv', '.txt', '.docx'];
            const ext = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
            if (!allowed.includes(ext)) {
                return { success: false, message: `File type "${ext}" not in allowed list: ${allowed.join(', ')}` };
            }
            // Actual file upload is dispatched to the WebView/Playwright layer via the executor;
            // the registry handler signals intent so the action catalog shows up in LLM prompts.
            return { success: true, message: `Upload "${filePath}" → input[${p.targetId}]`, data: { filePath, targetId: p.targetId } };
        },
    });
};

/** System actions — from web-ui-1's SystemActionsMixin */
export const registerSystemActions = (): void => {
    actionRegistry.register({
        name: 'record_knowledge', category: 'system', requiresTarget: false,
        description: 'Save a discovered fact to the knowledge hierarchy',
        handler: async (p) => ({ success: true, message: `Recorded: ${p.value?.slice(0, 50)}` }),
    });
    actionRegistry.register({
        name: 'lookup_documentation', category: 'extraction', requiresTarget: false,
        description: 'Look up documentation or reference material',
        handler: async (p) => ({ success: true, message: `Lookup: ${p.value}` }),
    });
    actionRegistry.register({
        name: 'take_screenshot', category: 'debugging', requiresTarget: false,
        description: 'Capture current page state for debugging',
        handler: async () => ({ success: true, message: 'Screenshot captured' }),
    });
};

/** Register all action mixins — call once at app init */
export const registerAllActions = (askAssistantCallback?: AskAssistantCallback): void => {
    registerNavigationActions();
    registerInteractionActions(askAssistantCallback);
    registerSystemActions();
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

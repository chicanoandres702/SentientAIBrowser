// Feature: Agent | Why: Extensible action registry with O(1) dispatch — web-ui-1's Controller + Mixin pattern
// Register named actions with metadata; dispatch by action name instead of if/else chains

export interface RegisteredAction {
    name: string;
    category: ActionCategory;
    description: string;
    handler: (params: ActionParams) => Promise<ActionResult>;
    requiresTarget: boolean;
}

export type ActionCategory = 'navigation' | 'interaction' | 'extraction' | 'system' | 'debugging' | 'user';

export interface ActionParams {
    targetId?: string;
    value?: string;
    url?: string;
    extra?: Record<string, unknown>;
}

export interface ActionResult {
    success: boolean;
    message: string;
    data?: unknown;
}

/** Singleton registry of all available agent actions */
class ActionRegistry {
    private actions = new Map<string, RegisteredAction>();

    /** Register a new action — replaces existing if same name */
    register(action: RegisteredAction): void {
        this.actions.set(action.name, action);
    }

    /** O(1) action lookup and execution */
    async execute(name: string, params: ActionParams): Promise<ActionResult> {
        const action = this.actions.get(name);
        if (!action) return { success: false, message: `Unknown action: ${name}` };
        if (action.requiresTarget && !params.targetId) {
            return { success: false, message: `Action '${name}' requires a targetId` };
        }
        return action.handler(params);
    }

    /** Check if an action exists */
    has(name: string): boolean {
        return this.actions.has(name);
    }

    /** Get all actions in a category */
    getByCategory(category: ActionCategory): RegisteredAction[] {
        return [...this.actions.values()].filter(a => a.category === category);
    }

    /** List all registered action names — useful for LLM prompt injection */
    listActionNames(): string[] {
        return [...this.actions.keys()];
    }

    /** Build action catalog string for LLM system prompt */
    buildCatalogPrompt(): string {
        const groups = new Map<ActionCategory, RegisteredAction[]>();
        for (const a of this.actions.values()) {
            const list = groups.get(a.category) || [];
            list.push(a);
            groups.set(a.category, list);
        }
        let prompt = '### AVAILABLE ACTIONS:\n';
        for (const [cat, actions] of groups) {
            prompt += `\n**${cat.toUpperCase()}:**\n`;
            for (const a of actions) {
                prompt += `- \`${a.name}\`${a.requiresTarget ? ' (requires targetId)' : ''}: ${a.description}\n`;
            }
        }
        return prompt;
    }

    /** Clear all actions (useful for testing) */
    clear(): void {
        this.actions.clear();
    }
}

/** Module-level singleton — web-ui-1's global registry pattern */
export const actionRegistry = new ActionRegistry();

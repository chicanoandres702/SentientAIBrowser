// Feature: Agent | Why: Strategy pattern for dynamic model switching — web-ui-1's manage_model_switching()
// Upgrades model on failure streaks, downgrades on success streaks to optimize cost

export interface ModelTier {
    provider: 'google' | 'openai' | 'anthropic';
    model: string;
    label: string;
    costPerKToken: number;
}

export interface ModelSwitcherState {
    currentIndex: number;
    tiers: ModelTier[];
    enableSmartRetry: boolean;
    enableCostSaver: boolean;
    failureThreshold: number;
    successThreshold: number;
    switchedToRetry: boolean;
    usingCheapModel: boolean;
}

/** Default tier cascade: cheapest → most capable */
const DEFAULT_TIERS: ModelTier[] = [
    { provider: 'google', model: 'gemini-2.0-flash', label: 'Flash (Budget)', costPerKToken: 0.0001 },
    { provider: 'google', model: 'gemini-2.5-pro-preview-06-05', label: 'Pro (Mid)', costPerKToken: 0.007 },
    { provider: 'openai', model: 'gpt-4o', label: 'GPT-4o (Premium)', costPerKToken: 0.01 },
    { provider: 'anthropic', model: 'claude-sonnet-4-20250514', label: 'Claude (Expert)', costPerKToken: 0.015 },
];

export const createModelSwitcherState = (
    tiers: ModelTier[] = DEFAULT_TIERS,
): ModelSwitcherState => ({
    currentIndex: 0,
    tiers,
    enableSmartRetry: true,
    enableCostSaver: true,
    failureThreshold: 3,
    successThreshold: 5,
    switchedToRetry: false,
    usingCheapModel: false,
});

/** Attempt to upgrade to a more capable model after consecutive failures */
export const tryUpgradeModel = (
    state: ModelSwitcherState, consecutiveFailures: number,
): { switched: boolean; newTier: ModelTier | null } => {
    if (!state.enableSmartRetry) return { switched: false, newTier: null };
    if (consecutiveFailures < state.failureThreshold) return { switched: false, newTier: null };

    const nextIdx = state.currentIndex + 1;
    if (nextIdx >= state.tiers.length) return { switched: false, newTier: null };

    state.currentIndex = nextIdx;
    state.switchedToRetry = true;
    state.usingCheapModel = false;
    return { switched: true, newTier: state.tiers[nextIdx] };
};

/** Downgrade to a cheaper model after sustained success streak */
export const tryDowngradeModel = (
    state: ModelSwitcherState, successStreak: number,
): { switched: boolean; newTier: ModelTier | null } => {
    if (!state.enableCostSaver) return { switched: false, newTier: null };
    if (successStreak < state.successThreshold) return { switched: false, newTier: null };

    const prevIdx = state.currentIndex - 1;
    if (prevIdx < 0) return { switched: false, newTier: null };

    state.currentIndex = prevIdx;
    state.usingCheapModel = true;
    state.switchedToRetry = false;
    return { switched: true, newTier: state.tiers[prevIdx] };
};

/** Get the current active model tier */
export const getCurrentTier = (state: ModelSwitcherState): ModelTier =>
    state.tiers[state.currentIndex];

/** Reset switcher state (e.g., on new mission) */
export const resetModelSwitcher = (state: ModelSwitcherState): void => {
    state.currentIndex = 0;
    state.switchedToRetry = false;
    state.usingCheapModel = false;
};

/** Build model-switch context injection for the LLM prompt */
export const buildModelSwitchContext = (state: ModelSwitcherState): string => {
    const tier = getCurrentTier(state);
    if (state.switchedToRetry) {
        return `\n⚡ MODEL UPGRADED to ${tier.label} after failures. Use enhanced reasoning.`;
    }
    if (state.usingCheapModel) {
        return `\n💰 COST-SAVER: Using ${tier.label}. Keep responses concise.`;
    }
    return '';
};

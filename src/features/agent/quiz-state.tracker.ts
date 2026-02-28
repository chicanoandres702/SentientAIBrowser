// Feature: Agent | Why: Multi-page form/wizard state persistence — web-ui-1's QuizStateManager
// Tracks progress through multi-step workflows, persists across page reloads

import { Platform } from 'react-native';

/** Platform-agnostic key-value store — localStorage on web, in-memory fallback otherwise */
const kvStore = {
    async getItem(key: string): Promise<string | null> {
        try {
            if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
                return localStorage.getItem(key);
            }
        } catch { /* no-op */ }
        return memoryCache.get(key) ?? null;
    },
    async setItem(key: string, value: string): Promise<void> {
        try {
            if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
                localStorage.setItem(key, value);
                return;
            }
        } catch { /* no-op */ }
        memoryCache.set(key, value);
    },
};
const memoryCache = new Map<string, string>();

export interface QuizState {
    currentQuestion: number;
    totalQuestions: number;
    completedSteps: string[];
    lastKnownAnchor: string | null;
    isInterrupted: boolean;
    formId: string;
    startedAt: number;
    lastUpdatedAt: number;
}

const STORAGE_KEY = 'quiz_state_';

export const createQuizState = (formId: string): QuizState => ({
    currentQuestion: 0,
    totalQuestions: 0,
    completedSteps: [],
    lastKnownAnchor: null,
    isInterrupted: false,
    formId,
    startedAt: Date.now(),
    lastUpdatedAt: Date.now(),
});

/** Regex patterns for detecting quiz/wizard progress in page text */
const PROGRESS_PATTERNS = [
    /(?:question|step|page)\s+(\d+)\s*(?:of|\/)\s*(\d+)/i,
    /(\d+)\s*(?:of|\/)\s*(\d+)\s*(?:questions?|steps?|pages?)/i,
    /(?:progress|step)\s*:\s*(\d+)\s*\/\s*(\d+)/i,
];

/** Sync quiz state from page text — auto-detects "Question X of Y" patterns */
export const syncFromPageText = (state: QuizState, pageText: string): boolean => {
    for (const pattern of PROGRESS_PATTERNS) {
        const match = pattern.exec(pageText);
        if (match) {
            const current = parseInt(match[1], 10);
            const total = parseInt(match[2], 10);
            if (current > 0 && total > 0 && current <= total) {
                state.currentQuestion = current;
                state.totalQuestions = total;
                state.lastUpdatedAt = Date.now();
                return true;
            }
        }
    }
    return false;
};

/** Mark a step as completed */
export const markStepCompleted = (state: QuizState, stepId: string): void => {
    if (!state.completedSteps.includes(stepId)) {
        state.completedSteps.push(stepId);
        state.lastUpdatedAt = Date.now();
    }
};

/** Calculate completion percentage */
export const getCompletionPct = (state: QuizState): number =>
    state.totalQuestions > 0 ? Math.round((state.currentQuestion / state.totalQuestions) * 100) : 0;

/** Persist state to AsyncStorage */
export const saveQuizState = async (state: QuizState): Promise<void> => {
    try {
        await kvStore.setItem(STORAGE_KEY + state.formId, JSON.stringify(state));
    } catch (e) {
        console.warn('[QuizState] Save failed:', e);
    }
};

/** Load persisted state from AsyncStorage */
export const loadQuizState = async (formId: string): Promise<QuizState | null> => {
    try {
        const raw = await kvStore.getItem(STORAGE_KEY + formId);
        if (!raw) return null;
        return JSON.parse(raw) as QuizState;
    } catch {
        return null;
    }
};

/** Build context injection for LLM — tells agent where in the form we are */
export const buildQuizContext = (state: QuizState): string => {
    if (state.totalQuestions === 0) return '';
    const pct = getCompletionPct(state);
    return [
        `\n### QUIZ/FORM STATE:`,
        `- Progress: Question ${state.currentQuestion} of ${state.totalQuestions} (${pct}%)`,
        `- Completed steps: ${state.completedSteps.length}`,
        state.isInterrupted ? '- ⚠️ Previously interrupted — resume from last anchor' : '',
        state.lastKnownAnchor ? `- Last anchor: ${state.lastKnownAnchor}` : '',
    ].filter(Boolean).join('\n');
};

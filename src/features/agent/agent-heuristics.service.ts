// Feature: Agent | Why: Port of web-ui-1's AgentHeuristics — loop detection, progress tracking, blocking detection

/** Heuristic state tracked across agent steps */
export interface HeuristicState {
    consecutiveFailures: number;
    successStreak: number;
    lastActionUrl: string;
    lastAction: string;
    repeatCount: number;
    stuckDetected: boolean;
    progressRegex: RegExp;
}

/** Navigation state classification — from web-ui-1's evaluate_site_state */
export type NavState = 'on_track' | 'lost' | 'failed' | 'blocked' | 'empty';

export const createHeuristicState = (): HeuristicState => ({
    consecutiveFailures: 0, successStreak: 0,
    lastActionUrl: '', lastAction: '', repeatCount: 0,
    stuckDetected: false,
    progressRegex: /(?:question|step|page)\s+(\d+)\s*(?:of|\/)\s*(\d+)/i,
});

/** Detect agent loop — same action + same URL 3+ times (web-ui-1 pattern) */
export const detectLoop = (
    state: HeuristicState, currentAction: string, currentUrl: string,
): { isLoop: boolean; message: string } => {
    if (currentAction === state.lastAction && currentUrl === state.lastActionUrl) {
        state.repeatCount++;
    } else {
        state.repeatCount = 0;
    }
    state.lastAction = currentAction;
    state.lastActionUrl = currentUrl;

    if (state.repeatCount >= 3) {
        state.stuckDetected = true;
        return { isLoop: true, message: 'LOOP DETECTED: Same action repeated 3+ times. CHANGE STRATEGY.' };
    }
    return { isLoop: false, message: '' };
};

/** Track success/failure streaks for model switching decisions */
export const recordStepOutcome = (
    state: HeuristicState, success: boolean,
): void => {
    if (success) {
        state.consecutiveFailures = 0;
        state.successStreak++;
        state.stuckDetected = false;
    } else {
        state.consecutiveFailures++;
        state.successStreak = 0;
    }
};

/** Classify navigation state — from web-ui-1's navigation_recovery.py */
export const assessNavState = (url: string, domNodeCount: number): NavState => {
    if (!url || url === 'about:blank') return 'lost';
    const lower = url.toLowerCase();
    if (lower.includes('404') || lower.includes('error') || lower.includes('access-denied')) return 'failed';
    if (lower.includes('captcha') || lower.includes('challenge') || lower.includes('google_vignette')) return 'blocked';
    if (domNodeCount < 5) return 'empty';
    return 'on_track';
};

/** Extract quiz/wizard progress from page text (web-ui-1's sync_from_page) */
export const detectProgress = (
    state: HeuristicState, pageText: string,
): { current: number; total: number } | null => {
    const match = state.progressRegex.exec(pageText);
    if (!match) return null;
    return { current: parseInt(match[1], 10), total: parseInt(match[2], 10) };
};

/** Check if max failures exceeded — triggers auto-save and stop */
export const shouldAutoStop = (
    state: HeuristicState, maxFailures: number = 5,
): boolean => state.consecutiveFailures >= maxFailures;

/** Build injection message for the LLM based on heuristic findings */
export const buildHeuristicInjection = (
    state: HeuristicState, navState: NavState,
): string => {
    const parts: string[] = [];
    if (state.stuckDetected) parts.push('⚠️ LOOP: Agent is repeating actions. Try an alternative approach.');
    if (navState === 'lost') parts.push('🧭 LOST: Page is blank. Navigate to the target URL.');
    if (navState === 'blocked') parts.push('🛡️ BLOCKED: CAPTCHA or challenge detected. Solve or skip.');
    if (navState === 'failed') parts.push('❌ ERROR PAGE: HTTP error detected. Go back and retry.');
    if (navState === 'empty') parts.push('📭 EMPTY: Page has minimal content. Wait or reload.');
    return parts.length > 0 ? `\n### HEURISTIC ALERTS:\n${parts.join('\n')}` : '';
};

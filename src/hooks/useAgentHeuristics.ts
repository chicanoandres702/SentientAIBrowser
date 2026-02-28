// Feature: Agent | Why: React hook composing all web-ui-1 heuristics into the DOM decision pipeline
import { useRef, useCallback } from 'react';
import {
    createHeuristicState, detectLoop, recordStepOutcome,
    assessNavState, buildHeuristicInjection, shouldAutoStop,
    HeuristicState,
} from '../features/agent/agent-heuristics.service';
import {
    createModelSwitcherState, tryUpgradeModel, tryDowngradeModel,
    buildModelSwitchContext, ModelSwitcherState,
} from '../features/agent/model-switcher.service';
import {
    createQuizState, syncFromPageText, buildQuizContext, saveQuizState,
    QuizState,
} from '../features/agent/quiz-state.tracker';

export interface HeuristicContext {
    /** Extra prompt context to inject before the LLM call */
    promptInjection: string;
    /** Whether the agent should stop (max failures, loop) */
    shouldStop: boolean;
    /** Current model override (if switched) */
    modelOverride: { provider: string; model: string } | null;
    /** Navigation state classification */
    navState: string;
}

/**
 * Composes heuristics, model switching, and quiz state tracking.
 * Call `preStepCheck` before each LLM call, and `postStepRecord` after.
 */
export const useAgentHeuristics = () => {
    const heuristicsRef = useRef<HeuristicState>(createHeuristicState());
    const switcherRef = useRef<ModelSwitcherState>(createModelSwitcherState());
    const quizRef = useRef<QuizState>(createQuizState('default'));

    /** Run before each LLM decision call — returns injection context */
    const preStepCheck = useCallback((
        currentAction: string, currentUrl: string,
        domNodeCount: number, pageText?: string,
    ): HeuristicContext => {
        const h = heuristicsRef.current;
        const s = switcherRef.current;
        const q = quizRef.current;

        // 1. Loop detection
        const loop = detectLoop(h, currentAction, currentUrl);

        // 2. Navigation state assessment
        const navState = assessNavState(currentUrl, domNodeCount);

        // 3. Quiz/wizard progress detection
        if (pageText) syncFromPageText(q, pageText);

        // 4. Model switching (upgrade on failures)
        let modelOverride: { provider: string; model: string } | null = null;
        const upgrade = tryUpgradeModel(s, h.consecutiveFailures);
        if (upgrade.switched && upgrade.newTier) {
            modelOverride = { provider: upgrade.newTier.provider, model: upgrade.newTier.model };
        }

        // 5. Build composite prompt injection
        const injection = [
            buildHeuristicInjection(h, navState),
            buildModelSwitchContext(s),
            buildQuizContext(q),
            loop.isLoop ? `\n⚠️ ${loop.message}` : '',
        ].filter(Boolean).join('\n');

        return {
            promptInjection: injection,
            shouldStop: shouldAutoStop(h),
            modelOverride,
            navState,
        };
    }, []);

    /** Record step outcome after execution — drives model switching decisions */
    const postStepRecord = useCallback((success: boolean) => {
        const h = heuristicsRef.current;
        const s = switcherRef.current;
        recordStepOutcome(h, success);

        // Try downgrade on success streak (cost saver)
        if (success) tryDowngradeModel(s, h.successStreak);

        // Persist quiz state periodically
        saveQuizState(quizRef.current).catch(() => {});
    }, []);

    /** Reset all state (new mission) */
    const resetHeuristics = useCallback(() => {
        heuristicsRef.current = createHeuristicState();
        switcherRef.current = createModelSwitcherState();
        quizRef.current = createQuizState('default');
    }, []);

    return { preStepCheck, postStepRecord, resetHeuristics };
};

// Feature: Agent | Why: Barrel export for all agent services — keeps imports clean
export { createHeuristicState, detectLoop, recordStepOutcome, assessNavState, detectProgress, shouldAutoStop, buildHeuristicInjection } from './agent-heuristics.service';
export type { HeuristicState, NavState } from './agent-heuristics.service';

export { createModelSwitcherState, tryUpgradeModel, tryDowngradeModel, getCurrentTier, resetModelSwitcher, buildModelSwitchContext } from './model-switcher.service';
export type { ModelTier, ModelSwitcherState } from './model-switcher.service';

export { createMissionMachine, transition, shouldTerminate, isTerminal, canExecute, getPhaseLabel, getElapsedMs } from './mission-state-machine';
export type { MissionPhase, MissionMachineState } from './mission-state-machine';

export { actionRegistry } from './action-registry.service';
export type { RegisteredAction, ActionCategory, ActionParams, ActionResult } from './action-registry.service';

export { registerAllActions } from './action-mixins.service';

export { confirmAction, shouldConfirm } from './confirmer.service';
export type { ConfirmerResult, StrictnessLevel } from './confirmer.service';

export { createQuizState, syncFromPageText, markStepCompleted, getCompletionPct, saveQuizState, loadQuizState, buildQuizContext } from './quiz-state.tracker';
export type { QuizState } from './quiz-state.tracker';

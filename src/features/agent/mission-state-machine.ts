// Feature: Agent | Why: Formal state machine for mission lifecycle — from web-ui-1's LangGraph pattern
// Provides deterministic phase transitions with guard conditions

export type MissionPhase =
    | 'idle'
    | 'planning'
    | 'executing'
    | 'reassessing'
    | 'blocked'
    | 'paused'
    | 'completed'
    | 'failed';

export interface MissionMachineState {
    phase: MissionPhase;
    previousPhase: MissionPhase;
    stepCount: number;
    maxSteps: number;
    blockedReason: string;
    startTime: number;
    lastTransitionTime: number;
}

/** Valid transition map — enforces only legal phase changes */
const TRANSITIONS: Record<MissionPhase, MissionPhase[]> = {
    idle: ['planning'],
    planning: ['executing', 'failed'],
    executing: ['reassessing', 'blocked', 'paused', 'completed', 'failed'],
    reassessing: ['executing', 'completed', 'failed'],
    blocked: ['executing', 'paused', 'failed'],
    paused: ['executing', 'reassessing', 'failed'],
    completed: ['idle'],
    failed: ['idle', 'planning'],
};

export const createMissionMachine = (maxSteps: number = 50): MissionMachineState => ({
    phase: 'idle',
    previousPhase: 'idle',
    stepCount: 0,
    maxSteps,
    blockedReason: '',
    startTime: 0,
    lastTransitionTime: Date.now(),
});

/** Attempt a phase transition — returns success boolean */
export const transition = (
    state: MissionMachineState, to: MissionPhase, reason?: string,
): boolean => {
    const allowed = TRANSITIONS[state.phase];
    if (!allowed.includes(to)) {
        console.warn(`[StateMachine] Invalid transition: ${state.phase} → ${to}`);
        return false;
    }
    state.previousPhase = state.phase;
    state.phase = to;
    state.lastTransitionTime = Date.now();

    if (to === 'planning') state.startTime = Date.now();
    if (to === 'executing') state.stepCount++;
    if (to === 'blocked') state.blockedReason = reason || 'Unknown';

    return true;
};

/** Guard: Should stop executing? (max steps, timeout) */
export const shouldTerminate = (state: MissionMachineState): boolean => {
    if (state.stepCount >= state.maxSteps) return true;
    const elapsed = Date.now() - state.startTime;
    // 10 minute hard timeout
    if (state.startTime > 0 && elapsed > 600_000) return true;
    return false;
};

/** Guard: Is the mission in a terminal state? */
export const isTerminal = (state: MissionMachineState): boolean =>
    state.phase === 'completed' || state.phase === 'failed';

/** Guard: Can we execute the next step? */
export const canExecute = (state: MissionMachineState): boolean =>
    state.phase === 'executing' && !shouldTerminate(state);

/** Get a human-readable status label */
export const getPhaseLabel = (phase: MissionPhase): string => {
    const labels: Record<MissionPhase, string> = {
        idle: '⏸ Idle', planning: '📐 Planning', executing: '⚡ Executing',
        reassessing: '🔄 Reassessing', blocked: '🛡️ Blocked',
        paused: '⏯ Paused', completed: '✅ Completed', failed: '❌ Failed',
    };
    return labels[phase];
};

/** Get elapsed time since mission start */
export const getElapsedMs = (state: MissionMachineState): number =>
    state.startTime > 0 ? Date.now() - state.startTime : 0;

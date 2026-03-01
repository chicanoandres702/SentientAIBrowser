// Feature: Core | Trace: README.md
import { TaskItem } from '../features/tasks/types';
import { buildHeuristicInjection } from '../features/agent/agent-heuristics.service';

export const getCurrentNonMissionTask = (tasks: TaskItem[]): TaskItem | null => {
    const inProgress = tasks.find(t => !t.isMission && t.status === 'in_progress');
    if (inProgress) return inProgress;
    return tasks.find(t => !t.isMission && t.status === 'pending') || null;
};

export const buildDefaultHeuristicPrompt = (navState: string): string =>
    buildHeuristicInjection({
        consecutiveFailures: 0,
        successStreak: 0,
        lastActionUrl: '',
        lastAction: '',
        repeatCount: 0,
        stuckDetected: false,
        progressRegex: /(?:question|step|page)\s+(\d+)\s*(?:of|\/)\s*(\d+)/i,
    }, navState as any);

export const resolveFirstStep = (decision: any): any => decision?.execution?.segments?.[0]?.steps?.[0];

export const applyLoginGate = (
    decision: any,
    setStatusMessage: (m: string) => void,
    setIsPaused: (v: boolean) => void,
    setBlockedReason: (r: string) => void,
    setIsBlockedModalVisible: (v: boolean) => void,
): boolean => {
    if (!decision?.isLoginPage) return false;
    setStatusMessage('Auth Required');
    setIsPaused(true);
    setBlockedReason(decision.blockedReason || 'A security wall (Login) has been detected.');
    setIsBlockedModalVisible(true);
    return true;
};

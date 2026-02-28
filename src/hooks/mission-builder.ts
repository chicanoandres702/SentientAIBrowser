// Feature: Core | Why: Builds mission tasks from LLM planner response segments
import { auth, db } from '../features/auth/firebase-config';
import { doc, setDoc } from 'firebase/firestore';
import { TaskItem, SubAction } from '../features/tasks/types';

interface MissionBuilderDeps {
    addTask: (title: string, status: any, details?: string, extra?: Partial<TaskItem>) => Promise<any>;
    setStatusMessage: (m: string) => void;
}

/** Create mission + child tasks from planner segments, persist to Firestore */
export const buildMissionFromSegments = async (
    prompt: string,
    missionResponse: any,
    llmError: string | null,
    tabId: string,
    deps: MissionBuilderDeps,
) => {
    const segments = missionResponse.execution.segments;
    const missionId = Date.now().toString();

    // Top-level mission card (pinned header)
    await deps.addTask(prompt, 'in_progress', `${segments.length} tasks planned`, {
        id: missionId, isMission: true, missionId, progress: 0,
    });

    // One visible task per segment — steps become hidden sub-actions
    const allMissionTasks: any[] = [];
    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const steps = seg.steps || [];
        const segName = seg.name || `Step ${i + 1}`;

        const subActions: SubAction[] = steps.map((step: any) => ({
            action: step.action || 'interact',
            explanation: step.explanation || step.action,
            status: 'pending' as const,
        }));

        const taskId = await deps.addTask(
            segName,
            i === 0 ? 'in_progress' : 'pending',
            `${steps.length} action${steps.length !== 1 ? 's' : ''}`,
            { missionId, subActions, estimatedDuration: steps.length * 15000, startTime: i === 0 ? Date.now() : undefined },
        );

        for (const step of steps) {
            allMissionTasks.push({
                id: taskId + '-' + Math.random().toString(36).slice(2, 8),
                title: segName, action: step.action || 'Unknown action',
                status: 'pending', segment: segName, explanation: step.explanation, ...step,
            });
        }
    }

    // Persist mission document to Firestore
    if (auth.currentUser && allMissionTasks.length > 0) {
        try {
            await setDoc(doc(db, 'missions', missionId), {
                id: missionId, userId: auth.currentUser.uid, goal: prompt,
                status: 'active', progress: 0, tasks: allMissionTasks,
                tabId, lastAction: missionResponse.meta?.reasoning || 'Executing plan',
                createdAt: Date.now(), missionResponse,
            });
        } catch (e) { console.error('Failed to save mission:', e); }
    }

    deps.setStatusMessage(llmError ? 'Tasks loaded (LLM fallback)' : 'Mission planned — ready for execution');
};

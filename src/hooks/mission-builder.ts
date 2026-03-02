// Feature: Core | Why: Builds mission tasks from LLM planner response segments
import { auth, db } from '../features/auth/firebase-config';
import { doc, setDoc, getDocs, query, collection, where, updateDoc } from 'firebase/firestore';
import { TaskItem, SubAction } from '../features/tasks/types';

interface MissionBuilderDeps {
    addTask: (title: string, status: any, details?: string, extra?: Partial<TaskItem>) => Promise<any>;
    setStatusMessage: (m: string) => void;
    useConfirmerAgent?: boolean;
    runtimeGeminiApiKey?: string;
}

const buildMissionHeaderTitle = (prompt: string, firstSegmentName?: string): string => {
    const base = (firstSegmentName || prompt || 'Mission').replace(/\s+/g, ' ').trim();
    const words = base.split(' ').slice(0, 5).join(' ');
    const compact = words.length > 34 ? `${words.slice(0, 34).trim()}…` : words;
    return `Mission: ${compact}`;
};

/** Create mission + child tasks from planner segments, persist to Firestore */
export const buildMissionFromSegments = async (
    prompt: string,
    missionResponse: any,
    llmError: string | null,
    tabId: string,
    runIdOverride: string | null,
    deps: MissionBuilderDeps,
) => {
    const ACTION_DURATION_MS = 15000;
    const MISSION_SCHEMA_VERSION = 2;
    const now = Date.now();
    const segments = missionResponse.execution.segments;
    const missionId = now.toString();
    const runId = runIdOverride || `run_${missionId}`;
    const workflowId = tabId;
    const workspaceId = auth.currentUser?.uid || 'anonymous';

    const missionCardTitle = buildMissionHeaderTitle(prompt, segments?.[0]?.name);

    // Top-level mission card (pinned header)
    await deps.addTask(missionCardTitle, 'in_progress', `${segments.length} tasks planned`, {
        id: missionId, isMission: true, missionId, progress: 0,
        runId, tabId, workflowId, workspaceId, order: 0, source: 'planner', startTime: now,
    });

    // One visible task per segment — steps become hidden sub-actions
    const allMissionTasks: any[] = [];
    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const steps = seg.steps || [];
        const segName = seg.name || `Step ${i + 1}`;

        const subActions: SubAction[] = steps.map((step: any) => ({
            action: step.action || 'interact',
            goal: step.goal || segName,
            explanation: step.explanation || step.action,
            status: 'pending' as const,
        }));

        const taskId = await deps.addTask(
            segName,
            i === 0 ? 'in_progress' : 'pending',
            `${steps.length} action${steps.length !== 1 ? 's' : ''}`,
            {
                missionId,
                runId,
                tabId,
                workflowId,
                workspaceId,
                order: i + 1,
                source: 'planner',
                subActions,
                estimatedDuration: steps.length * ACTION_DURATION_MS,
                startTime: i === 0 ? now : undefined,
            },
        );

        for (const step of steps) {
            allMissionTasks.push({
                id: taskId + '-' + Math.random().toString(36).slice(2, 8),
                title: segName, action: step.action || 'Unknown action',
                status: 'pending', segment: segName, explanation: step.explanation, runId, tabId, workflowId, workspaceId, ...step,
            });
        }
    }

    // Abandon any existing active / waiting missions for this user BEFORE creating the new one.
    // Why: The backend orchestrator runs ALL active missions simultaneously — leaving old missions
    // active causes parallel executor chaos, page-state fighting, and the UI 'switching' between
    // workflows the user sees. Mark them completed so their loops exit on the next cycle check.
    if (auth.currentUser) {
        try {
            const userId = auth.currentUser.uid;
            const staleSnap = await getDocs(
                query(collection(db, 'missions'),
                    where('userId', '==', userId),
                    where('status', 'in', ['active', 'waiting']),
                ),
            );
            await Promise.all(staleSnap.docs.map(d =>
                updateDoc(d.ref, { status: 'completed', lastAction: '⏹ Superseded by new mission', updatedAt: Date.now() })
            ));
            if (staleSnap.size > 0) console.log(`[MissionBuilder] Abandoned ${staleSnap.size} stale mission(s) before starting new one.`);
        } catch (e) { console.warn('[MissionBuilder] Could not abandon stale missions:', e); }
    }

    // Persist mission document to Firestore
    if (auth.currentUser && allMissionTasks.length > 0) {
        try {
            await setDoc(doc(db, 'missions', missionId), {
                id: missionId, userId: auth.currentUser.uid, goal: prompt,
                status: 'active', progress: 0, tasks: allMissionTasks,
                tabId, runId, taskCount: allMissionTasks.length,
                workflowId, workspaceId,
                lastAction: missionResponse.meta?.reasoning || 'Executing plan',
                startedAt: now, updatedAt: now, schemaVersion: MISSION_SCHEMA_VERSION,
                createdAt: now, missionResponse,
                useConfirmerAgent: deps.useConfirmerAgent ?? true,
                runtimeApiKey: deps.runtimeGeminiApiKey || '',
            });
        } catch (e) { console.error('Failed to save mission:', e); }
    }

    deps.setStatusMessage(llmError ? 'Tasks loaded (LLM fallback) — executing...' : 'Mission active — executing first task');
};

// Feature: Mission | Why: Bridges backend executor step results → task_queues Firestore docs
// so the frontend onSnapshot listener sees live subAction completions without any polling.
import { db } from './proxy-config';

/** Find the task_queues document for a given mission segment (matched by missionId + order) */
export async function findSegmentTaskId(missionId: string, segOrder: number): Promise<string | null> {
    const snap = await db.collection('task_queues')
        .where('missionId', '==', missionId)
        .where('order', '==', segOrder)
        .limit(1)
        .get();
    return snap.empty ? null : snap.docs[0].id;
}

/** Mark a single subAction in a task_queues document as in_progress / completed / failed */
export async function setSubActionStatus(
    taskDocId: string,
    subIdx: number,
    status: 'in_progress' | 'completed' | 'failed',
): Promise<void> {
    const ref = db.collection('task_queues').doc(taskDocId);
    const snap = await ref.get();
    if (!snap.exists) return;
    const subActions = [...(snap.data()?.subActions || [])];
    if (subActions[subIdx]) subActions[subIdx] = { ...subActions[subIdx], status };
    await ref.update({ subActions, updated_at: new Date().toISOString() });
}

/**
 * Mark a segment task completed and auto-advance the next pending sibling to in_progress.
 * Why: auto-advance logic lives here (backend) rather than duplicating it in the frontend hook,
 * so Cloud Run execution and frontend manual control both move the queue forward correctly.
 */
export async function completeSegmentTask(
    taskDocId: string,
    missionId: string,
    segOrder: number,
): Promise<void> {
    await db.collection('task_queues').doc(taskDocId).update({
        status: 'completed',
        progress: 100,
        completedTime: Date.now(),
        updated_at: new Date().toISOString(),
    });
    // Advance next pending sibling
    const nextSnap = await db.collection('task_queues')
        .where('missionId', '==', missionId)
        .where('order', '==', segOrder + 1)
        .limit(1)
        .get();
    if (!nextSnap.empty) {
        const nextRef = nextSnap.docs[0].ref;
        const nextData = nextSnap.docs[0].data();
        // Why: mark only the first sub-action in_progress so the UI shows granular step progress
        const firstSub = (nextData.subActions || []).map((sa: any, i: number) =>
            i === 0 ? { ...sa, status: 'in_progress' } : sa,
        );
        await nextRef.update({
            status: 'in_progress',
            startTime: Date.now(),
            subActions: firstSub,
            updated_at: new Date().toISOString(),
        });
    }
}

/** Mark a segment task failed in task_queues */
export async function failSegmentTask(taskDocId: string): Promise<void> {
    await db.collection('task_queues').doc(taskDocId).update({
        status: 'failed',
        updated_at: new Date().toISOString(),
    });
}

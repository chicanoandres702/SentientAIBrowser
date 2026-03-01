"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findSegmentTaskId = findSegmentTaskId;
exports.findCurrentSegmentTask = findCurrentSegmentTask;
exports.setSubActionStatus = setSubActionStatus;
exports.completeSegmentTask = completeSegmentTask;
exports.failSegmentTask = failSegmentTask;
// Feature: Mission | Why: Bridges backend executor step results → task_queues Firestore docs
// so the frontend onSnapshot listener sees live subAction completions without any polling.
const proxy_config_1 = require("./proxy-config");
/** Find the task_queues document for a given mission segment (matched by missionId + order) */
async function findSegmentTaskId(missionId, segOrder) {
    const snap = await proxy_config_1.db.collection('task_queues')
        .where('missionId', '==', missionId)
        .where('order', '==', segOrder)
        .limit(1)
        .get();
    return snap.empty ? null : snap.docs[0].id;
}
/**
 * Find the currently runnable segment task for a mission.
 * Priority: first in_progress task, otherwise first pending task.
 */
async function findCurrentSegmentTask(missionId) {
    const snap = await proxy_config_1.db.collection('task_queues')
        .where('missionId', '==', missionId)
        .orderBy('order', 'asc')
        .limit(100)
        .get();
    if (snap.empty)
        return null;
    const docs = snap.docs
        .map(d => ({ id: d.id, data: d.data() }))
        .filter(d => { var _a; return !((_a = d.data) === null || _a === void 0 ? void 0 : _a.isMission); });
    const active = docs.find(d => { var _a; return ((_a = d.data) === null || _a === void 0 ? void 0 : _a.status) === 'in_progress'; });
    if (active)
        return { id: active.id, order: Number(active.data.order || 0), status: active.data.status };
    const pending = docs.find(d => { var _a; return ((_a = d.data) === null || _a === void 0 ? void 0 : _a.status) === 'pending'; });
    if (pending)
        return { id: pending.id, order: Number(pending.data.order || 0), status: pending.data.status };
    return null;
}
/** Mark a single subAction in a task_queues document as in_progress / completed / failed */
async function setSubActionStatus(taskDocId, subIdx, status) {
    const ref = proxy_config_1.db.collection('task_queues').doc(taskDocId);
    const snap = await ref.get();
    if (!snap.exists)
        return;
    const data = snap.data();
    const subActions = [...((data === null || data === void 0 ? void 0 : data.subActions) || [])];
    if (subIdx >= subActions.length) {
        subActions.push({ action: 'step', explanation: `Step ${subIdx + 1}`, status: 'pending' });
    }
    if (subActions[subIdx])
        subActions[subIdx] = Object.assign(Object.assign({}, subActions[subIdx]), { status });
    const total = subActions.length || 1;
    const completed = subActions.filter((sa) => sa.status === 'completed').length;
    const inProgress = subActions.filter((sa) => sa.status === 'in_progress').length;
    const progress = Math.max(0, Math.min(99, Math.round(((completed + inProgress * 0.5) / total) * 100)));
    await ref.update({
        subActions,
        progress,
        status: status === 'in_progress' ? 'in_progress' : data === null || data === void 0 ? void 0 : data.status,
        updated_at: new Date().toISOString(),
    });
}
/**
 * Mark a segment task completed and auto-advance the next pending sibling to in_progress.
 * Why: auto-advance logic lives here (backend) rather than duplicating it in the frontend hook,
 * so Cloud Run execution and frontend manual control both move the queue forward correctly.
 */
async function completeSegmentTask(taskDocId, missionId, segOrder) {
    await proxy_config_1.db.collection('task_queues').doc(taskDocId).update({
        status: 'completed',
        progress: 100,
        completedTime: Date.now(),
        updated_at: new Date().toISOString(),
    });
    // Advance next pending sibling
    const nextSnap = await proxy_config_1.db.collection('task_queues')
        .where('missionId', '==', missionId)
        .where('order', '==', segOrder + 1)
        .limit(1)
        .get();
    if (!nextSnap.empty) {
        const nextRef = nextSnap.docs[0].ref;
        const nextData = nextSnap.docs[0].data();
        // Why: mark only the first sub-action in_progress so the UI shows granular step progress
        const firstSub = (nextData.subActions || []).map((sa, i) => i === 0 ? Object.assign(Object.assign({}, sa), { status: 'in_progress' }) : sa);
        await nextRef.update({
            status: 'in_progress',
            startTime: Date.now(),
            subActions: firstSub,
            updated_at: new Date().toISOString(),
        });
    }
}
/** Mark a segment task failed in task_queues */
async function failSegmentTask(taskDocId) {
    await proxy_config_1.db.collection('task_queues').doc(taskDocId).update({
        status: 'failed',
        updated_at: new Date().toISOString(),
    });
}
//# sourceMappingURL=task-queue-bridge.js.map
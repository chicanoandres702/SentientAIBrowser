"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTaskDocs = createTaskDocs;
function createTaskDocs(stepQueue) {
    return stepQueue.map((step, i) => ({
        id: `step-${Date.now()}-${i}`,
        action: step.action,
        explanation: step.explanation,
        title: `${step.action}: ${step.explanation}`.substring(0, 80),
        status: 'pending',
    }));
}
//# sourceMappingURL=mission-step-queue.js.map
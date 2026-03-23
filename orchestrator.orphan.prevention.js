// Feature: Orchestrator Orphan Prevention | Trace: orchestrator.orphan.prevention.js
const { traceLog } = require('./orchestrator.trace');

function enforceOrphanPrevention(tasks) {
  if (tasks.length > 1) {
    traceLog('Multiple tasks detected. Split required.', { event: 'orphan-prevention', error: true });
    throw new Error('Orphan prevention: Only one task per turn allowed. Split required.');
  }
  const task = tasks[0];
  if (!task || !task.milestone || !task.id) {
    traceLog('Orphaned task detected. Missing milestone or issue ID.', { event: 'orphan-prevention', error: true });
    throw new Error('Orphaned task detected. Milestone and issue ID required.');
  }
  traceLog('Orphan prevention passed', { event: 'orphan-prevention', task });
  return true;
}

module.exports = { enforceOrphanPrevention };

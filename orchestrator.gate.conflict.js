// Feature: Orchestrator Merge Conflict Gate | Trace: orchestrator.gate.conflict.js
const { traceLog } = require('./orchestrator.trace');

function gateMergeConflictHandling() {
  const conflictBranch = process.env.CONFLICT_BRANCH || '';
  if (conflictBranch.startsWith('conflict/')) {
    traceLog('Gate: Merge conflict detected', { gate: 'merge-conflict', conflictBranch });
    throw new Error('Merge conflict gate failed: conflict branch present');
  }
  traceLog('Gate: No merge conflict', { gate: 'merge-conflict', conflictBranch });
  return true;
}

module.exports = { gateMergeConflictHandling };

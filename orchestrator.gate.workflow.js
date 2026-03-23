// Feature: Orchestrator Workflow Gate | Trace: orchestrator.gate.workflow.js
const { traceLog } = require('./orchestrator.trace');

function gateWorkflow(issue) {
  if (!issue || typeof issue !== 'object') {
    traceLog('Gate: Workflow - invalid issue object', { gate: 'workflow' });
    throw new Error('Workflow gate failed: invalid issue object');
  }
  if (!issue.milestone || !issue.branch) {
    traceLog('Gate: Workflow - missing milestone/branch', { gate: 'workflow', issue });
    throw new Error('Workflow gate failed: missing milestone or branch');
  }
  traceLog('Gate: Workflow passed', { gate: 'workflow', issue });
  return true;
}

module.exports = { gateWorkflow };

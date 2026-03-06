// Feature: Orchestrator Risk Gate | Trace: orchestrator.gate.risk.js
const { traceLog } = require('./orchestrator.trace');

function gateRisk(issue) {
  traceLog('Gate: Risk check started', { gate: 'risk', issue });
  if (!issue || typeof issue !== 'object') {
    traceLog('Gate: Risk - invalid issue object', { gate: 'risk', error: 'invalid issue object' });
    throw new Error('Risk gate failed: invalid issue object');
  }
  if (issue.labels && issue.labels.includes('high-risk')) {
    traceLog('Gate: Risk - high risk detected', { gate: 'risk', issue });
    throw new Error('Risk gate failed: high risk label detected');
  }
  traceLog('Gate: Risk passed', { gate: 'risk', issue });
  return true;
}

module.exports = { gateRisk };

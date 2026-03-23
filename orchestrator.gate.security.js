// Feature: Orchestrator Security Gate | Trace: orchestrator.gate.security.js
const { traceLog } = require('./orchestrator.trace');

function gateSecurity(issue) {
  traceLog('Gate: Security check started', { gate: 'security', issue });
  if (!issue || typeof issue !== 'object') {
    traceLog('Gate: Security - invalid issue object', { gate: 'security', error: 'invalid issue object' });
    throw new Error('Security gate failed: invalid issue object');
  }
  if (issue.labels && issue.labels.includes('security')) {
    traceLog('Gate: Security - security label detected', { gate: 'security', issue });
    throw new Error('Security gate failed: security label detected');
  }
  traceLog('Gate: Security passed', { gate: 'security', issue });
  return true;
}

module.exports = { gateSecurity };

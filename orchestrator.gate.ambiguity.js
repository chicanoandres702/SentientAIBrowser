// Feature: Orchestrator Ambiguity Gate | Trace: orchestrator.gate.ambiguity.js
const { traceLog } = require('./orchestrator.trace');

function gateAmbiguity(issue) {
  traceLog('Gate: Ambiguity check started', { gate: 'ambiguity', issue });
  if (!issue || typeof issue !== 'object') {
    traceLog('Gate: Ambiguity - invalid issue object', { gate: 'ambiguity', error: 'invalid issue object' });
    throw new Error('Ambiguity gate failed: invalid issue object');
  }
  if (!issue.title || !issue.body) {
    traceLog('Gate: Ambiguity - missing title/body', { gate: 'ambiguity', error: 'missing title/body' });
    throw new Error('Ambiguity gate failed: missing title or body');
  }
  traceLog('Gate: Ambiguity passed', { gate: 'ambiguity', issue });
  return true;
}

module.exports = { gateAmbiguity };

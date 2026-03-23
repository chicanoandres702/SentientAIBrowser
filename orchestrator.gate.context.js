// Feature: Orchestrator Context Discipline Gate | Trace: orchestrator.gate.context.js
const path = require('path');
const fs = require('fs');
const { traceLog } = require('./orchestrator.trace');

function gateContextDiscipline() {
  traceLog('Gate: Context discipline check started', { gate: 'context-discipline' });
  const featuresDir = path.join(__dirname, 'src', 'features');
  if (!fs.existsSync(featuresDir)) {
    traceLog('Gate: Context discipline failed (vertical slice missing)', { gate: 'context-discipline', error: 'featuresDir missing' });
    throw new Error('Context discipline gate failed: vertical slice missing');
  }
  traceLog('Gate: Context discipline passed', { gate: 'context-discipline' });
  return true;
}

module.exports = { gateContextDiscipline };

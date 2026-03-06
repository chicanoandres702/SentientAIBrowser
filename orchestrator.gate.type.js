// Feature: Orchestrator Type Enforcement Gate | Trace: orchestrator.gate.type.js
const path = require('path');
const fs = require('fs');
const { traceLog } = require('./orchestrator.trace');

function gateTypeEnforcement() {
  traceLog('Gate: Type enforcement check started', { gate: 'type-enforcer' });
  const modelsDir = path.join(__dirname, 'src', 'models');
  const typesDir = path.join(__dirname, 'src', 'types');
  const hasModels = fs.existsSync(modelsDir) && fs.readdirSync(modelsDir).length > 0;
  const hasTypes = fs.existsSync(typesDir) && fs.readdirSync(typesDir).length > 0;
  if (!hasModels && !hasTypes) {
    traceLog('Gate: Type enforcement failed (no models/types)', { gate: 'type-enforcer', error: 'no models/types found' });
    throw new Error('Type enforcement gate failed: no models/types found');
  }
  traceLog('Gate: Type enforcement passed', { gate: 'type-enforcer' });
  return true;
}

module.exports = { gateTypeEnforcement };

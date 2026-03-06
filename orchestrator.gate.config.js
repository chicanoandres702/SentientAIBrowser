// Feature: Orchestrator Config Registry Gate | Trace: orchestrator.gate.config.js
const path = require('path');
const fs = require('fs');
const { traceLog } = require('./orchestrator.trace');

function gateConfigRegistry() {
  const configFile = path.join(__dirname, 'agent-config.yaml');
  if (!fs.existsSync(configFile)) {
    traceLog('Gate: Config registry missing', { gate: 'config-registry', configFile });
    throw new Error('Config registry gate failed: agent-config.yaml missing');
  }
  traceLog('Gate: Config registry present', { gate: 'config-registry', configFile });
  return true;
}

module.exports = { gateConfigRegistry };

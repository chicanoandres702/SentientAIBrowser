// Feature: Orchestrator Release/Tag Workflow Gate | Trace: orchestrator.gate.release.js
const path = require('path');
const fs = require('fs');
const { traceLog } = require('./orchestrator.trace');

function gateReleaseTagWorkflow() {
  const releaseWorkflow = path.join(__dirname, '.github', 'workflows', 'release.yml');
  if (!fs.existsSync(releaseWorkflow)) {
    traceLog('Gate: Release workflow missing', { gate: 'release-workflow', releaseWorkflow });
    throw new Error('Release workflow gate failed: release.yml missing');
  }
  traceLog('Gate: Release workflow present', { gate: 'release-workflow', releaseWorkflow });
  return true;
}

module.exports = { gateReleaseTagWorkflow };

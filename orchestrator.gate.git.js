// Feature: Orchestrator Git Gate | Trace: orchestrator.gate.git.js
const { traceLog } = require('./orchestrator.trace');
const fs = require('fs');
const path = require('path');

function gateGitStatus() {
  const gitDir = path.join(__dirname, '.git');
  if (!fs.existsSync(gitDir)) {
    traceLog('Gate: Git directory missing', { gate: 'git' });
    throw new Error('Git gate failed: .git directory missing');
  }
  traceLog('Gate: Git directory present', { gate: 'git' });
  return true;
}

module.exports = { gateGitStatus };

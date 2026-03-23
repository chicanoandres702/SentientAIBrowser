// Feature: Orchestrator Audit Logging Gate | Trace: orchestrator.gate.audit.js
const path = require('path');
const fs = require('fs');
const { traceLog } = require('./orchestrator.trace');

function gateAuditLogging() {
  traceLog('Gate: Audit log check started', { gate: 'audit-log' });
  const auditLogFile = path.join(__dirname, 'audit.log');
  if (!fs.existsSync(auditLogFile)) {
    traceLog('Gate: Audit log missing', { gate: 'audit-log', error: 'audit.log missing' });
    throw new Error('Audit log gate failed: audit.log missing');
  }
  traceLog('Gate: Audit log present', { gate: 'audit-log' });
  return true;
}

module.exports = { gateAuditLogging };

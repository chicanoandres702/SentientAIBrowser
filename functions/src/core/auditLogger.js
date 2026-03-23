// Sentient Audit Logger
// Appends all orchestrator actions and gate checks to audit.log
const fs = require('fs');
const path = require('path');
const AUDIT_LOG_PATH = path.resolve(__dirname, '../../audit.log');

function auditLogger(message, meta = {}) {
  const entry = `[${new Date().toISOString()}] ${message} ${JSON.stringify(meta)}\n`;
  try {
    fs.appendFileSync(AUDIT_LOG_PATH, entry, 'utf8');
  } catch (err) {
    console.error('AuditLogger error:', err.message);
  }
}

module.exports = { auditLogger };

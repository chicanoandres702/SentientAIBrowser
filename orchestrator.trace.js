const { auditLogger } = require('./functions/src/core/auditLogger');
function traceLog(message, meta) {
  auditLogger(message, meta);
  console.log(`[TRACE] ${message}`, meta || '');
}
module.exports = { traceLog };

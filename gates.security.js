// Feature: Orchestrator Gates | Trace: gates.security.js
function gateSecurityScan() {
  const auditOutput = process.env.AUDIT_OUTPUT || '';
  const secretsFound = auditOutput.includes('secret');
  const vulnerabilities = auditOutput.includes('vulnerability');
  if (secretsFound || vulnerabilities) {
    console.log('[TRACE] Gate: Security scan failed', { gate: 'security-scan', auditOutput });
    throw new Error('Security scan gate failed: secrets or vulnerabilities found');
  }
  console.log('[TRACE] Gate: Security scan passed', { gate: 'security-scan' });
  return true;
}
module.exports = { gateSecurityScan };

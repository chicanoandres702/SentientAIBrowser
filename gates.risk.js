// Feature: Orchestrator Gates | Trace: gates.risk.js
function gateRiskEscalation(tasks) {
  if (tasks.some(t => t.labels && t.labels.includes('critical'))) {
    console.log('[TRACE] Tactical Gate: Critical risk detected, escalation required', { gate: 'risk-escalation', tasks });
    throw new Error('Risk escalation gate: Critical risk detected, escalate to human review');
  }
  console.log('[TRACE] Tactical Gate: No critical risk detected', { gate: 'risk-escalation', tasks });
  return true;
}
module.exports = { gateRiskEscalation };

// Feature: Orchestrator Gates | Trace: gates.ambiguity.js
function gateAmbiguityDetection(tasks) {
  if (tasks.some(t => !t.title || t.title.match(/ambiguous|unclear|unknown|TBD|\?\?\?/i))) {
    console.log('[TRACE] Tactical Gate: Ambiguity detected in task', { gate: 'ambiguity', tasks });
    throw new Error('Ambiguity gate: Task is ambiguous, requires clarification');
  }
  console.log('[TRACE] Tactical Gate: No ambiguity detected', { gate: 'ambiguity', tasks });
  return true;
}
module.exports = { gateAmbiguityDetection };

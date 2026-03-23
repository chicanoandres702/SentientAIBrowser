// Feature: Orchestrator Main Logic | Trace: orchestrator.orchestrate.js
const { traceLog } = require('./orchestrator.trace');
const { loadTasks } = require('./orchestrator.tasks');
const { runOrchestration } = require('./orchestrator.core');

let syncLock = false;

async function orchestrate() {
  if (syncLock) return;
  syncLock = true;
  try {
    traceLog('Starting orchestration', { event: 'orchestrate', level: 'info' });
    const tasks = loadTasks();
    if (tasks.length > 1) {
      traceLog('Multiple tasks detected. Split into separate issues per AIDDE protocol.', { event: 'task-split', tasks });
      throw new Error('AIDDE Protocol: Only one task per turn allowed. Split required.');
    }
    const task = tasks[0];
    if (!task || !task.milestone || !task.id) {
      traceLog('Orphaned task detected. Missing milestone or issue ID.', { event: 'orphan-check', task });
      throw new Error('AIDDE Protocol: Orphaned task detected. Milestone and issue ID required.');
    }
    traceLog('Traceability Check', { event: 'traceability', milestone: task.milestone, issue: task.id, title: task.title });
    await runOrchestration(tasks);
    traceLog('Orchestration completed', { event: 'orchestrate', level: 'info' });
  } catch (e) {
    traceLog(`Workflow failed: ${e.message}`, { event: 'orchestrate', level: 'error' });
  } finally {
    syncLock = false;
  }
}

module.exports = { orchestrate };

// Feature: Orchestrator Tasks Loader | Trace: orchestrator.tasks.js
const fs = require('fs');
const { CONFIG } = require('./orchestrator.config');
const { traceLog } = require('./orchestrator.trace');

function loadTasks() {
  const source = fs.existsSync(CONFIG.tasksFile) ? CONFIG.tasksFile : CONFIG.fallbackTasksFile;
  if (!fs.existsSync(source)) return [];
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(source, 'utf8'));
  } catch (e) {
    traceLog(`Could not parse tasks file: ${e.message}`, { event: 'loadTasks', level: 'warn' });
    return [];
  }
  const items = Array.isArray(raw) ? raw : (Array.isArray(raw?.tasks) ? raw.tasks : []);
  if (!Array.isArray(items)) return [];
  return items.map((t, idx) => ({
    id: t.id || `${idx + 1}`,
    title: t.title || t.label || `Task ${idx + 1}`,
    milestone: t.milestone || 'automation',
    status: t.status || 'pending',
  }));
}

module.exports = { loadTasks };

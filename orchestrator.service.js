// Feature: Core | Trace: README.md
const fs = require('fs');
const path = require('path');
const { runOrchestration } = require('./orchestrator.core');

/**
 * Sentient Orchestration Service
 * Consolidates background sync using GH CLI mandates.
 */
const CONFIG = {
  tasksFile: path.join(__dirname, 'tasks.json'),
  fallbackTasksFile: path.join(__dirname, '.vscode', 'tasks.json'),
  debounceMs: 5000,
  ignored: ['.git', 'node_modules', '.expo', 'dist', 'tasks.json']
};

let syncLock = false;
let syncTimer = null;

function loadTasks() {
  const source = fs.existsSync(CONFIG.tasksFile) ? CONFIG.tasksFile : CONFIG.fallbackTasksFile;
  if (!fs.existsSync(source)) return [];
  const raw = JSON.parse(fs.readFileSync(source, 'utf8') || '[]');
  const items = Array.isArray(raw) ? raw : (Array.isArray(raw?.tasks) ? raw.tasks : []);
  return items.map((t, idx) => ({
    id: t.id || `${idx + 1}`,
    title: t.title || t.label || `Task ${idx + 1}`,
    milestone: t.milestone || 'automation',
    status: t.status || 'pending',
  }));
}

async function orchestrate() {
  if (syncLock) return;
  syncLock = true;
  
  try {
    await runOrchestration(loadTasks());
  } catch (e) {
    console.error(`[Orchestrator] Workflow failed: ${e.message}`);
  } finally {
    syncLock = false;
  }
}

fs.watch(path.join(__dirname), { recursive: true }, (event, file) => {
  if (!file || CONFIG.ignored.some(i => file.includes(i))) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(orchestrate, CONFIG.debounceMs);
});

console.log('--- Sentient GH Orchestrator Active ---');
orchestrate();


// Feature: Orchestrator Config | Trace: orchestrator.config.js
const path = require('path');

const CONFIG = {
  tasksFile: path.join(__dirname, 'tasks.json'),
  fallbackTasksFile: path.join(__dirname, '.vscode', 'tasks.json'),
  debounceMs: 5000,
  ignored: ['.git', 'node_modules', '.expo', 'dist', 'tasks.json']
};

module.exports = { CONFIG };

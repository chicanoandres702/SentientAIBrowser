// Feature: Core | Trace: README.md
const fs = require('fs');
const path = require('path');
const { execCmd, getSafeTitle } = require('./scripts/git-utils');

const DEBOUNCE_MS = 5000;
const TASKS_FILE = path.join(__dirname, 'tasks.json');
const IGNORED = ['.git', 'node_modules', '.expo', 'dist', 'web-build', 'tasks.json'];

let isSyncing = false;
let timeout = null;

async function runGhSync() {
    if (isSyncing) return;
    isSyncing = true;
    try {
        const tasks = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8') || '[]');
        const activeTask = tasks.find(t => t.status === 'in-progress');
        if (!activeTask) return;

        const branch = `task/${getSafeTitle(activeTask.title)}`;
        execCmd(`git checkout -b ${branch} || git checkout ${branch}`, __dirname);
        execCmd('git add .', __dirname);
        execCmd(`git commit -m "feat: ${activeTask.title}"`, __dirname);
        execCmd(`git push origin ${branch}`, __dirname);
        
        console.log(`[GH Sync] Synced task: ${activeTask.title}`);
    } catch (e) {
        console.error(`[GH Sync] Error: ${e.message}`);
    } finally {
        isSyncing = false;
    }
}

fs.watch(__dirname, { recursive: true }, (eventType, filename) => {
    if (!filename || IGNORED.some(i => filename.includes(i))) return;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(runGhSync, DEBOUNCE_MS);
});

console.log('--- GH CLI Autonomous Sync Service Started ---');

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log("[Git Watcher] Starting watcher mode...");

const WATCH_DIRS = [
  path.join(__dirname, 'src'),
  path.join(__dirname, 'tasks.json')
];

let debounceTimer = null;
const DEBOUNCE_MS = 5000;

function handleFileChange(eventType, filename) {
  if (filename && (filename.endsWith('.tmp') || filename.includes('node_modules'))) return;
  
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    console.log(`[Git Watcher] Activity detected. Triggering auto-commit...`);
    executeGitSync();
  }, DEBOUNCE_MS);
}

function executeGitSync() {
    const commitMsg = "AI: Autonomous Sync Update";
    const command = `git add . && git commit -m "${commitMsg}" && git push`;
    
    exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
        if (error) {
            // Only log actual errors, not "nothing to commit" which git treats as error 1
            if (!stdout.includes('nothing to commit')) {
               console.error(`[Git Watcher] Error: ${error.message}`);
               console.error(`[Git Watcher] stderr: ${stderr}`);
            } else {
               console.log(`[Git Watcher] No changes to commit.`);
            }
            return;
        }
        console.log(`[Git Watcher] Successfully synced changes:\n${stdout}`);
    });
}

// Watch src folder
fs.watch(WATCH_DIRS[0], { recursive: true }, handleFileChange);

// Watch tasks.json explicitly
if (fs.existsSync(WATCH_DIRS[1])) {
    fs.watch(WATCH_DIRS[1], handleFileChange);
}

console.log(`[Git Watcher] Listening for changes in: ${WATCH_DIRS.join(', ')}`);

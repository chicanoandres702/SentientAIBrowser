// Feature: Core | Trace: README.md
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Sentient Orchestration Service
 * Consolidates background sync using GH CLI mandates.
 */
const CONFIG = {
  tasksFile: path.join(__dirname, '..', 'tasks.json'),
  debounceMs: 5000,
  ignored: ['.git', 'node_modules', '.expo', 'dist', 'tasks.json']
};

let syncLock = false;
let syncTimer = null;

function ghQuery(cmd) {
  try {
    return execSync(`gh ${cmd}`, { encoding: 'utf8', stdio: 'pipe' }).trim();
  } catch (e) {
    console.error(`[Orchestrator] GH CLI Error: ${e.message}`);
    return null;
  }
}

async function orchestrate() {
  if (syncLock) return;
  syncLock = true;
  
  try {
    const tasks = JSON.parse(fs.readFileSync(CONFIG.tasksFile, 'utf8') || '[]');
    
    // 1. Proactive Branching: Ensure every task has a branch
    tasks.forEach(task => {
      if (task.status !== 'completed') {
        const branch = `task/${task.id}`;
        try {
          execSync(`git show-ref --verify --quiet refs/heads/${branch}`, { stdio: 'ignore' });
        } catch (e) {
          console.log(`[Orchestrator] Provisioning new task branch: ${branch}`);
          execSync(`git branch ${branch}`, { stdio: 'ignore' });
        }
      }
    });

    const active = tasks.find(t => t.status === 'in-progress');
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();

    // 2. No-Main Enforcement
    const hasChanges = execSync('git status --porcelain').toString().length > 0;
    if (currentBranch === 'main' && hasChanges) {
      if (active) {
        const targetBranch = `task/${active.id}`;
        console.log(`[Orchestrator] Directing work from main to active task branch: ${targetBranch}`);
        execSync(`git stash push -m "Orchestrator: Auto-migrating from main" -u`, { stdio: 'ignore' });
        execSync(`git checkout ${targetBranch}`, { stdio: 'ignore' });
        try {
          execSync('git stash pop', { stdio: 'ignore' });
        } catch (e) {
          console.warn('[Orchestrator] Stash pop conflict during migration. Manual resolution recommended.');
        }
      } else {
        console.warn('[Orchestrator] Detected changes on main with no active task. Stashing for safety.');
        execSync(`git stash push -m "Orchestrator: Safety stash on main" -u`, { stdio: 'ignore' });
      }
    }

    // 3. High-Fidelity Sync for Active Task
    if (active) {
      const targetBranch = `task/${active.id}`;
      if (currentBranch === targetBranch) {
        const hasWork = execSync('git status --porcelain').toString().length > 0;
        if (hasWork) {
          console.log(`[Orchestrator] Anchoring progress to ${targetBranch}...`);
          execSync('git add .', { stdio: 'ignore' });
          execSync(`git commit -m "feat: ${active.title}" --allow-empty`, { stdio: 'ignore' });
          execSync(`git push origin ${targetBranch}`, { stdio: 'ignore' });

          const prs = ghQuery(`pr list --head ${targetBranch} --json number --jq '.[0].number'`);
          if (!prs) {
            console.log('[Orchestrator] Opening traceable PR...');
            ghQuery(`pr create --title "feat: ${active.title}" --body "Automated sync for task ${active.id}" --head ${targetBranch}`);
          }
        }
      } else if (currentBranch !== 'main') {
        // Handle migration if on wrong task branch
        console.log(`[Orchestrator] Task Mismatch: Switching from ${currentBranch} to ${targetBranch}`);
        if (hasChanges) execSync(`git stash push -m "Orchestrator: Migrating task context" -u`, { stdio: 'ignore' });
        execSync(`git checkout ${targetBranch}`, { stdio: 'ignore' });
        if (hasChanges) {
          try {
            execSync('git stash pop', { stdio: 'ignore' });
          } catch (e) {}
        }
      }
    }

    // 4. GitHub Tree Sync: Always keep remote planning updated
    try {
      require('./sync-gh-tree').sync();
    } catch (e) {
      console.warn(`[Orchestrator] GH Tree Sync failed: ${e.message}`);
    }
  } catch (e) {
    console.error(`[Orchestrator] Workflow failed: ${e.message}`);
  } finally {
    syncLock = false;
  }
}

fs.watch(path.join(__dirname, '..'), { recursive: true }, (event, file) => {
  if (!file || CONFIG.ignored.some(i => file.includes(i))) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(orchestrate, CONFIG.debounceMs);
});

console.log('--- Sentient GH Orchestrator Active ---');
orchestrate();

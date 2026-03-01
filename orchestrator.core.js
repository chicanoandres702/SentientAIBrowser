// Feature: Core | Trace: README.md
const { execSync } = require('child_process');

function getBranchName(task) {
  const milestone = (task.milestone || 'feature').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `${milestone}/${task.id}`;
}

function ghQuery(cmd) {
  try {
    return execSync(`gh ${cmd}`, { encoding: 'utf8', stdio: 'pipe' }).trim();
  } catch (e) {
    console.error(`[Orchestrator] GH CLI Error: ${e.message}`);
    return null;
  }
}

function ensureBranches(tasks) {
  tasks.forEach(task => {
    if (task.status === 'completed') return;
    const branch = getBranchName(task);
    try { execSync(`git show-ref --verify --quiet refs/heads/${branch}`, { stdio: 'ignore' }); }
    catch { console.log(`[Orchestrator] Provisioning path: ${branch}`); execSync(`git branch ${branch}`, { stdio: 'ignore' }); }
  });
}

function syncActiveTask(tasks) {
  const active = tasks.find(t => t.status === 'in-progress');
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  const hasChanges = execSync('git status --porcelain').toString().length > 0;
  if (!active || currentBranch !== getBranchName(active) || !hasChanges) return;
  const targetBranch = getBranchName(active);
  console.log(`[Orchestrator] Anchoring progress to ${targetBranch}...`);
  execSync('git add .', { stdio: 'ignore' });
  execSync(`git commit -m "feat: ${active.title}" --allow-empty`, { stdio: 'ignore' });
  execSync(`git push origin ${targetBranch}`, { stdio: 'ignore' });
  const prs = ghQuery(`pr list --head ${targetBranch} --json number --jq '.[0].number'`);
  if (!prs) ghQuery(`pr create --title "feat: ${active.title}" --body "Automated sync for task ${active.id}" --head ${targetBranch}`);
}

function migrateFromMain(tasks) {
  const active = tasks.find(t => t.status === 'in-progress');
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  const hasChanges = execSync('git status --porcelain').toString().length > 0;
  if (currentBranch !== 'main' || !hasChanges) return;
  if (!active) return execSync(`git stash push -m "Orchestrator: Safety stash on main" -u`, { stdio: 'ignore' });
  const targetBranch = getBranchName(active);
  execSync(`git stash push -m "Orchestrator: Auto-migrating from main" -u`, { stdio: 'ignore' });
  execSync(`git checkout ${targetBranch}`, { stdio: 'ignore' });
  try { execSync('git stash pop', { stdio: 'ignore' }); } catch {}
}

async function runOrchestration(tasks) {
  ensureBranches(tasks);
  migrateFromMain(tasks);
  syncActiveTask(tasks);
  try { require('./sync-gh-tree').sync(); }
  catch (e) { console.warn(`[Orchestrator] GH Tree Sync failed: ${e.message}`); }
}

module.exports = { runOrchestration };

// Feature: Orchestrator Gates | Trace: gates.git.js
function gateGitHierarchy(tasks) {
  const branch = process.env.BRANCH || '';
  const task = tasks[0];
  const featureBranchPattern = /^feature\/[a-zA-Z0-9_-]+$/;
  const taskBranchPattern = /^feature\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/;
  const isFeatureBranch = featureBranchPattern.test(branch);
  const isTaskBranch = taskBranchPattern.test(branch);
  if (!isFeatureBranch && !isTaskBranch) {
    console.log('[TRACE] Gate: Git hierarchy failed (branch naming)', { gate: 'git-hierarchy', branch });
    throw new Error('Git hierarchy gate failed: branch naming does not match feature/task pattern');
  }
  if (!task || !task.milestone || !task.id) {
    console.log('[TRACE] Gate: Git hierarchy failed (missing milestone/issue)', { gate: 'git-hierarchy', task });
    throw new Error('Git hierarchy gate failed: branch not mapped to milestone/issue');
  }
  const lastCommitDays = parseInt(process.env.LAST_COMMIT_DAYS || '0', 10);
  if (lastCommitDays >= 14) {
    console.log('[TRACE] Gate: Git hierarchy failed (stale branch)', { gate: 'git-hierarchy', branch, lastCommitDays });
    throw new Error('Git hierarchy gate failed: branch is stale (14+ days without commit)');
  }
  console.log('[TRACE] Gate: Git hierarchy passed', { gate: 'git-hierarchy', branch, task });
  return true;
}
module.exports = { gateGitHierarchy };

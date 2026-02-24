const fs = require('fs');
const { execSync, exec } = require('child_process');
const path = require('path');

const DEBOUNCE_MS = 5000;
const TASKS_FILE = path.join(__dirname, 'tasks.json');
const IGNORED = ['.git', 'node_modules', '.expo', 'dist', 'web-build', 'tasks.json'];

let timeout = null;
let isSyncing = false;

console.log('--- GH CLI Autonomous Sync Service Started ---');

function execCmd(cmd) {
    try {
        return execSync(cmd, { encoding: 'utf8', stdio: 'pipe', cwd: __dirname }).trim();
    } catch (e) {
        console.error(`[GH Sync Error] Command failed: ${cmd}`);
        if (e.stdout) console.error(`[GH Sync Output]: ${e.stdout.toString()}`);
        if (e.stderr) console.error(`[GH Sync Stderr]: ${e.stderr.toString()}`);
        return null;
    }
}

async function runGhSync() {
    if (isSyncing) return;
    isSyncing = true;

    try {
        // 1. Get Active Task
        let tasks = [];
        try {
            if (fs.existsSync(TASKS_FILE)) {
                tasks = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
            }
        } catch(e) {}

        const activeTask = tasks.find(t => t.status === 'in-progress');
        
        let branchName = 'main';
        let issueNumber = null;

        if (activeTask && activeTask.title) {
            // Find existing issue using GH CLI
            console.log(`[GH Sync] Finding issue for task: ${activeTask.title}`);
            const query = `in:title "${activeTask.title.replace(/"/g, '\\"')}"`;
            const issueJson = execCmd(`gh issue list --state open --search '${query}' --json number --limit 1`);
            
            if (issueJson && issueJson !== '[]') {
                const issues = JSON.parse(issueJson);
                issueNumber = issues[0].number;
            } else {
                // Issue doesn't exist yet, we could trigger creation or wait for frontend to do it.
                // Alternatively, create it right here!
                console.log(`[GH Sync] Creating new issue for task...`);
                const createOut = execCmd(`gh issue create --title "${activeTask.title.replace(/"/g, '\\"')}" --body "Autonomous Sync for Task ID: ${activeTask.id}" --label "ai-autonomy"`);
                if (createOut) {
                    // Output format is usually the URL: https://github.com/owner/repo/issues/NUMBER
                    const match = createOut.match(/\/issues\/(\d+)/);
                    if (match) issueNumber = match[1];
                }
            }

            if (issueNumber) {
                // Ensure we are on an associated branch
                // 'gh issue develop' will create and checkout a branch for the issue.
                // We format the branch name to match git naming rules
                const safeTitle = activeTask.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                branchName = `issue-${issueNumber}-${safeTitle}`;
                
                const currentBranch = execCmd('git branch --show-current');
                
                if (currentBranch !== branchName) {
                    console.log(`[GH Sync] Switching to feature branch: ${branchName} for issue #${issueNumber}`);
                    execCmd(`gh issue develop ${issueNumber} --name "${branchName}" --checkout`);
                }
            }
        } else {
            // No active task, default to main branch
            const currentBranch = execCmd('git branch --show-current');
            if (currentBranch !== 'main') {
                console.log(`[GH Sync] No active task. Switching back to main.`);
                execCmd('git checkout main');
            }
        }

        // 2. Commit and Push
        const status = execCmd('git status --porcelain');
        if (!status) {
            console.log('[GH Sync] Workspace clean. Nothing to sync.');
        } else {
            const commitMsg = activeTask ? `Autonomous Sync: ${activeTask.title} (#${issueNumber || 'unknown'})` : `Autonomous Sync: Background Update`;
            console.log(`[GH Sync] Committing changes to branch ${branchName}...`);
            execCmd('git add .');
            execCmd(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`);
            
            // Push
            console.log(`[GH Sync] Pushing to origin ${branchName}...`);
            execCmd(`git push -u origin ${branchName}`);
            
            // 3. Create Pull Request if needed
            if (activeTask && issueNumber && branchName !== 'main') {
                console.log(`[GH Sync] Checking for existing Pull Request...`);
                const prJson = execCmd(`gh pr list --head ${branchName} --state open --json number`);
                let prExists = false;
                if (prJson && prJson !== '[]') {
                    prExists = true;
                }

                if (!prExists) {
                    console.log(`[GH Sync] Creating Pull Request for branch ${branchName}...`);
                    const prTitle = `Resolve: ${activeTask.title}`;
                    const prBody = `## Autonomous Action\nThis Pull Request was autonomously created by the Sentient AI Browser background watcher to address the active task: **${activeTask.title}**.\n\n### Task Details\n${activeTask.details || 'No additional details provided.'}\n\nCloses #${issueNumber}`;
                    
                    // Use a temporary file for the body to avoid multiline string escaping nightmare on Windows cmd.exe
                    const tmpBodyPath = path.join(__dirname, 'tmp-pr-body.md');
                    fs.writeFileSync(tmpBodyPath, prBody, 'utf8');

                    const safeTitle = prTitle.replace(/"/g, '\\"');
                    const createPrOut = execCmd(`gh pr create --title "${safeTitle}" --body-file tmp-pr-body.md`);
                    
                    try { if (fs.existsSync(tmpBodyPath)) fs.unlinkSync(tmpBodyPath); } catch(e){}

                    if (createPrOut) {
                        console.log(`[GH Sync] PR Created: ${createPrOut}`);
                    }
                } else {
                    console.log(`[GH Sync] PR already exists for this branch.`);
                }
            }

            console.log(`[GH Sync] Sync Successful.`);
        }

    } catch (e) {
        console.error(`[GH Sync] Fatal Error:`, e);
    } finally {
        isSyncing = false;
    }
}

function handleWatch(eventType, filename) {
    if (!filename) return;
    if (IGNORED.some(ignore => filename.includes(ignore))) return;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
        runGhSync();
    }, DEBOUNCE_MS);
}

// Watch filesystem
fs.watch(__dirname, { recursive: true }, handleWatch);

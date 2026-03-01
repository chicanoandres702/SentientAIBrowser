// Feature: Repository | Trace: .agents/workflows/github-tree-orchestrator.md
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TASKS_FILE = path.join(__dirname, '..', '..', '.antigravity-tasks.json');
const OWNER_REPO = 'chicanoandres702/SentientAIBrowser';

function gh(cmd) {
    try {
        return execSync(`gh ${cmd}`, { encoding: 'utf8', stdio: 'pipe' }).trim();
    } catch (e) {
        return null;
    }
}

function sync() {
    console.log('[GH-Sync] Synchronizing Hierarchical Task Tree...');
    if (!fs.existsSync(TASKS_FILE)) return;
    
    const tasks = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
    
    // 1. Ensure Milestones exist
    const milestoneMap = {};
    const milestones = JSON.parse(gh(`api repos/${OWNER_REPO}/milestones --jq '.[] | {title, number}'`) || '[]');
    milestones.forEach(m => milestoneMap[m.title] = m.number);

    tasks.forEach(task => {
        if (task.milestone && !milestoneMap[task.milestone]) {
            console.log(`[GH-Sync] Creating Milestone: ${task.milestone}`);
            const created = JSON.parse(gh(`api repos/${OWNER_REPO}/milestones -f title="${task.milestone}"`) || '{}');
            if (created.number) milestoneMap[task.milestone] = created.number;
        }
    });

    // 2. Sync Issues
    const existingIssues = JSON.parse(gh(`issue list --label ai-autonomy --json title,number,body,labels,milestone --limit 100`) || '[]');
    const idToGhNumber = {};
    
    tasks.forEach(task => {
        const existing = existingIssues.find(i => i.title === task.title);
        if (existing) idToGhNumber[task.id] = existing.number;
    });

    const sortedTasks = [...tasks].sort((a, b) => {
        const order = { 'epic': 1, 'task': 2, 'sub-task': 3 };
        return order[a.type] - order[b.type];
    });

    sortedTasks.forEach(task => {
        const existing = existingIssues.find(i => i.title === task.title);
        let body = task.details || `Synced ${task.type}`;
        
        if (task.parentId && idToGhNumber[task.parentId]) {
            body += `\n\n**Parent**: #${idToGhNumber[task.parentId]}`;
        }

        const milestoneTitle = task.milestone;
        const labels = `ai-autonomy,${task.type}`;

        if (!existing) {
            if (task.status !== 'completed') {
                console.log(`[GH-Sync] Creating ${task.type}: ${task.title} [${milestoneTitle || 'No Milestone'}]`);
                const milestoneArg = milestoneTitle ? `--milestone "${milestoneTitle}"` : '';
                const res = gh(`issue create --title "${task.title}" --body "${body}" --label "${labels}" ${milestoneArg}`);
                if (res) {
                    const number = res.match(/issues\/(\d+)/)?.[1] || res.match(/(\d+)$/)?.[1];
                    if (number) idToGhNumber[task.id] = number;
                }
            }
        } else {
            const existingMilestone = existing.milestone?.title;
            const needsBodyUpdate = existing.body !== body;
            const needsMilestoneUpdate = milestoneTitle && existingMilestone !== milestoneTitle;

            if (needsBodyUpdate || needsMilestoneUpdate) {
                console.log(`[GH-Sync] Syncing ${task.type}: ${task.title}`);
                let updateCmd = `issue edit ${existing.number}`;
                if (needsBodyUpdate) updateCmd += ` --body "${body}"`;
                if (needsMilestoneUpdate) updateCmd += ` --milestone "${milestoneTitle}"`;
                gh(updateCmd);
            }
        }
    });
    console.log('[GH-Sync] All tasks synchronized and mapped.');
}

if (require.main === module) sync();
module.exports = { sync };

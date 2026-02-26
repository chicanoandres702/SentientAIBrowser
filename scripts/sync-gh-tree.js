// Feature: Repository | Trace: .agents/workflows/github-tree-orchestrator.md
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TASKS_FILE = path.join(__dirname, '..', '.antigravity-tasks.json');
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
    const existingIssues = JSON.parse(gh(`issue list --label ai-autonomy --json title,number,body,labels --limit 100`) || '[]');
    const idToGhNumber = {};
    
    // Map existing issues to task IDs if possible (using title match for now)
    tasks.forEach(task => {
        const existing = existingIssues.find(i => i.title === task.title);
        if (existing) idToGhNumber[task.id] = existing.number;
    });

    // Sort tasks so epics are created first, then tasks, then sub-tasks
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

        if (!existing) {
            if (task.status !== 'completed') {
                console.log(`[GH-Sync] Creating ${task.type}: ${task.title}`);
                const milestoneArg = task.milestone ? `--milestone "${task.milestone}"` : '';
                const labels = `ai-autonomy,${task.type}`;
                const res = gh(`issue create --title "${task.title}" --body "${body}" --label "${labels}" ${milestoneArg}`);
                if (res) {
                    const number = res.match(/issuses\/(\d+)/)?.[1] || res.match(/(\d+)$/)?.[1];
                    if (number) idToGhNumber[task.id] = number;
                }
            }
        } else {
            // Update logic: if body differs significantly (ignoring Parent link if it was just added)
            if (existing.body !== body) {
                console.log(`[GH-Sync] Updating ${task.type} Body: ${task.title}`);
                gh(`issue edit ${existing.number} --body "${body}"`);
            }
        }
    });
}

if (require.main === module) sync();
module.exports = { sync };

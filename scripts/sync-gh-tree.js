// Feature: Repository | Trace: .agents/workflows/github-tree-orchestrator.md
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TASKS_FILE = path.join(__dirname, '..', 'tasks.json');
const OWNER_REPO = 'chicanoandres702/SentientAIBrowser';

function gh(cmd) {
    try {
        return execSync(`gh ${cmd}`, { encoding: 'utf8', stdio: 'pipe' }).trim();
    } catch (e) {
        return null;
    }
}

function sync() {
    console.log('[GH-Sync] Synchronizing Task Tree...');
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
    const existingIssues = JSON.parse(gh(`issue list --label ai-autonomy --json title,number,body --limit 100`) || '[]');
    
    tasks.forEach(task => {
        const existing = existingIssues.find(i => i.title === task.title);
        const taskDetails = task.details || 'Synced task';

        if (!existing) {
            if (task.status !== 'completed') {
                console.log(`[GH-Sync] Creating Issue: ${task.title}`);
                const milestoneArg = task.milestone ? `--milestone "${task.milestone}"` : '';
                gh(`issue create --title "${task.title}" --body "${taskDetails}" --label "ai-autonomy" ${milestoneArg}`);
            }
        } else {
            // Update logic: if body differs, sync it
            if (existing.body !== taskDetails) {
                console.log(`[GH-Sync] Updating Issue Body: ${task.title}`);
                gh(`issue edit ${existing.number} --body "${taskDetails}"`);
            }
        }
    });
}

if (require.main === module) sync();
module.exports = { sync };

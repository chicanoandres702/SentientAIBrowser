// Feature: Core | Trace: README.md
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Sentient Orchestration Service
 * Consolidates background sync using GH CLI mandates.
 */
const CONFIG = {
  tasksFile: path.join(__dirname, '..', '.antigravity-tasks.json'),
  debounceMs: 2000,
  ignored: ['.git', 'node_modules', 'dist'],
  artifactsDir: path.join(__dirname, '..', '.gemini', 'antigravity', 'brain', '3be3a35e-5767-4ff5-8c01-5573ac1c9750'),
  taskMd: 'C:\\Users\\Andrew\\.gemini\\antigravity\\brain\\3be3a35e-5767-4ff5-8c01-5573ac1c9750\\task.md'
};

let syncLock = false;
let syncTimer = null;

function syncMarkdownTasks() {
    if (!fs.existsSync(CONFIG.taskMd)) {
        console.warn(`[Orchestrator] task.md not found at ${CONFIG.taskMd}`);
        return;
    }
    const content = fs.readFileSync(CONFIG.taskMd, 'utf8');
    const lines = content.split(/\r?\n/).map(l => l.trimEnd());
    const tasks = [];
    let currentEpic = null;
    let currentTask = null;
    let currentMilestone = 'v1.0.0-foundation'; // Default milestone

    const getStatus = (char) => (char === 'x' ? 'completed' : char === '/' ? 'in-progress' : 'todo');

    lines.forEach(line => {
        // Capture H2 as Milestone (Phase)
        const phaseMatch = line.match(/^## (.+)$/i);
        if (phaseMatch) {
            currentMilestone = phaseMatch[1].trim(); 
            return;
        }

        const epicMatch = line.match(/^[\-\*] \[(x| |\/)\] (.+)$/);
        const taskMatch = line.match(/^ {2}[\-\*] \[(x| |\/)\] (.+)$/);
        const subTaskMatch = line.match(/^ {4}[\-\*] \[(x| |\/)\] (.+)$/);

        if (epicMatch) {
            currentEpic = { 
                id: `epic-${tasks.length + 1}`, 
                title: epicMatch[2].trim(), 
                status: getStatus(epicMatch[1]), 
                type: 'epic', 
                milestone: currentMilestone,
                tasks: [] 
            };
            currentTask = null;
            tasks.push(currentEpic);
        } else if (taskMatch && currentEpic) {
            currentTask = { 
                id: `task-${currentEpic.tasks.length + 1}`, 
                title: taskMatch[2].trim(), 
                status: getStatus(taskMatch[1]), 
                parentId: currentEpic.id,
                milestone: currentMilestone,
                subTasks: [] 
            };
            currentEpic.tasks.push(currentTask);
        } else if (subTaskMatch && currentTask) {
            currentTask.subTasks.push({ 
                id: `sub-${currentTask.subTasks.length + 1}`, 
                title: subTaskMatch[2].trim(), 
                status: getStatus(subTaskMatch[1]), 
                milestone: currentMilestone,
                parentId: `${currentEpic.id}-${currentTask.id}` 
            });
        }
    });

    const flatTasks = [];
    tasks.forEach(epic => {
        flatTasks.push({ id: epic.id, title: epic.title, status: epic.status, milestone: epic.milestone, type: 'epic' });
        epic.tasks.forEach(task => {
            const taskId = `${epic.id}-${task.id}`;
            flatTasks.push({ id: taskId, title: task.title, status: task.status, milestone: task.milestone, parentId: epic.id, type: 'task' });
            task.subTasks.forEach(sub => {
                flatTasks.push({ id: `${taskId}-${sub.id}`, title: sub.title, status: sub.status, milestone: sub.milestone, parentId: taskId, type: 'sub-task' });
            });
        });
    });

    fs.writeFileSync(CONFIG.tasksFile, JSON.stringify(flatTasks, null, 2));
    console.log(`[Orchestrator] Synchronized ${flatTasks.length} tasks to ${path.basename(CONFIG.tasksFile)}`);
}

function ghQuery(cmd) {
  try {
    return execSync(`gh ${cmd}`, { encoding: 'utf8', stdio: 'pipe' }).trim();
  } catch (e) {
    console.error(`[Orchestrator] GH CLI Error: ${e.message}`);
    return null;
  }
}

function createGitHubIssue(title, body, labels = 'ai-autonomy,bug') {
  console.log(`[Orchestrator] Logging autonomous issue: ${title}`);
  return ghQuery(`issue create --title "${title.replace(/"/g, '\\"')}" --body "${body.replace(/"/g, '\\"')}" --label "${labels}"`);
}

function recordKnowledge(filePath, knowledge) {
  console.log(`[Orchestrator] recording knowledge to ${filePath}`);
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(__dirname, '..', filePath);
  const dir = path.dirname(absolutePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const timestamp = new Date().toISOString();
  const entry = `\n\n### Entry: ${timestamp}\n${knowledge}\n`;
  
  if (fs.existsSync(absolutePath)) {
    fs.appendFileSync(absolutePath, entry);
  } else {
    fs.writeFileSync(absolutePath, `# AI Knowledge Base: ${path.basename(filePath)}\n${entry}`);
  }
}

function slugify(text) {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 30);
}

function getBranchName(task) {
  const milestone = slugify(task.milestone || 'feature');
  if (task.type === 'epic') return `epic/${milestone}`;
  
  const parentId = task.parentId || '';
  if (task.type === 'task') return `feat/${milestone}/${task.id}`;
  if (task.type === 'sub-task') return `sub/${milestone}/${task.id}`;
  
  return `${milestone}/${task.id}`;
}

async function orchestrate() {
  if (syncLock) return;
  syncLock = true;
  
  console.log('--- Orchestrator: Syncing ---');
  try {
    syncMarkdownTasks();

    try {
      require('./sync-gh-tree').sync();
    } catch (e) {
      console.warn(`[Orchestrator] GH Tree Sync failed: ${e.message}`);
    }
    console.log('--- Orchestrator: Ready ---');
  } catch (e) {
    console.error(`[Orchestrator] Workflow failed: ${e.message}`);
  } finally {
    syncLock = false;
  }
}

// 5. Consolidated Watcher
function triggerOrchestration(file) {
  if (!file || CONFIG.ignored.some(i => file.includes(i))) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(orchestrate, CONFIG.debounceMs);
}

// Watch Project Root
fs.watch(path.join(__dirname, '..'), { recursive: true }, (event, file) => {
  if (file && file.includes('.gemini')) return; // Artifacts handled separately or ignored by root watch
  triggerOrchestration(file);
});

// Watch Artifacts
if (fs.existsSync(CONFIG.artifactsDir)) {
  fs.watch(CONFIG.artifactsDir, { recursive: true }, (event, file) => {
    if (!file || !file.endsWith('.md')) return;
    console.log(`[Orchestrator] AI Artifact Change detected: ${file}`);
    triggerOrchestration(file);
  });
}

console.log('--- Orchestrator: Starting ---');
orchestrate();

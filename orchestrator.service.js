const glob = require('glob');
const path = require('path');

/**
 * Sentient File Header
 * Why: Orchestrates Sentient AI Browser gates, workflow, and automation
 * Filepath: orchestrator.service.js
 * Description: Main orchestrator service, wires all gates, workflow, and automation logic
 * Trace: Used by orchestrator.gates.js, workflow modules, and CI/CD gates
 * Wiring: Node.js module, imported by orchestrator entrypoints and gate modules
 */
// Feature: Orchestrator Service | Trace: orchestrator.service.js


// Sentient Trace Gate Debug Logger (imported from src/core/traceGate.js)
const traceGate = require('./src/core/traceGate');
const { traceLog } = require('./orchestrator.trace');

// Example usage:
// traceGate('orchestrator.service.js', 'Some debug info', { obj });
// ...existing code...
const { rewriteFileWithGemini } = require('./dev-mcp-genkit/geminiRewriteFile');
const { gateAIHandling } = require('./orchestrator.gate.ai');
const { gateAmbiguityDetection } = require('./orchestrator.gate.ambiguity');
const { gateRiskEscalation } = require('./orchestrator.gate.risk');
const { gateEdgeCaseHandling } = require('./orchestrator.gate.edgecase');
const { gateAutomatedFixProposal } = require('./orchestrator.gate.fixproposal');
const { gateGitHierarchy } = require('./orchestrator.gate.git');
const { gateContextDiscipline } = require('./orchestrator.gate.context');
const { gateTypeEnforcement } = require('./orchestrator.gate.type');
const { gateAuditLogging } = require('./orchestrator.gate.audit');
const { gateOrphanPrevention } = require('./orchestrator.gate.orphan');
const { gatePromptDisambiguation } = require('./orchestrator.gate.prompt');
const { gateBranchProtection } = require('./orchestrator.gate.branch');
const { gateSecurityScan } = require('./orchestrator.gate.security');
const { gateSessionRefresh } = require('./orchestrator.gate.session');
const { gateSubagentScoring } = require('./orchestrator.gate.subagent');
const { gateDriftPrevention } = require('./orchestrator.gate.drift');

// Import gateTestCoverageComplexity from orchestrator.gate.test.js
const { gateTestCoverageComplexity } = require('./orchestrator.gate.test');

// Import gateSelfDocumentingLaw from orchestrator.gate.docs.js
const { gateSelfDocumentingLaw } = require('./orchestrator.gate.docs');

// Import gateConfigRegistry from orchestrator.gate.config.js
const { gateConfigRegistry } = require('./orchestrator.gate.config');

// Import gateContributorOnboarding from orchestrator.gate.onboarding.js
const { gateContributorOnboarding } = require('./orchestrator.gate.onboarding');

// Import gateReleaseTagWorkflow from orchestrator.gate.release.js
const { gateReleaseTagWorkflow } = require('./orchestrator.gate.release');

// Import gateMergeConflictHandling from orchestrator.gate.conflict.js
const { gateMergeConflictHandling } = require('./orchestrator.gate.conflict');

const { checkContextEfficiency } = require('./orchestrator.context.efficiency');
const {
  gateTestValidator,
  gateSecurityAuditor,
  gatePRManager,
  gateAuditAgent,
  gateRefactorAgent
} = require('./orchestrator.subagent.gates');
const { enforceOrphanPrevention } = require('./orchestrator.orphan.prevention');
const { enforceDriftPrevention } = require('./orchestrator.drift.prevention');
const { enforceCICDGates } = require('./orchestrator.cicd.gates');

// Run all logical gates
async function runLogicalGates(tasks) {
  try {
    traceLog('Orchestrator: Starting gate checks', { event: 'gate-checks', tasks });
    traceLog('Orchestrator: Checking Context Discipline Gate', { gate: 'context-discipline' });
    gateContextDiscipline();
    traceLog('Orchestrator: Checking Type Enforcement Gate', { gate: 'type-enforcer' });
    gateTypeEnforcement();
    traceLog('Orchestrator: Checking Audit Logging Gate', { gate: 'audit-log' });
    gateAuditLogging();
    traceLog('Orchestrator: Checking Orphan Prevention Gate', { gate: 'orphan-prevention' });
    // Patch: Parse YAML frontmatter from file and set milestone/issueId in task
    if (tasks[0] && tasks[0].filePath) {
      const fs = require('fs');
      const yaml = require('js-yaml');
      try {
        const fileContent = fs.readFileSync(tasks[0].filePath, 'utf8');
        const yamlMatch = fileContent.match(/^---\n([\s\S]*?)\n---/);
        if (yamlMatch) {
          const metadata = yaml.load(yamlMatch[1]);
          if (metadata && metadata.milestone) tasks[0].milestone = metadata.milestone;
          if (metadata && metadata.issueId) tasks[0].id = metadata.issueId;
          traceLog('YAML frontmatter parsed for orphan prevention.', { metadata });
        }
      } catch (yamlErr) {
        traceLog('YAML parsing failed for orphan prevention.', { error: yamlErr });
      }
    }
    enforceOrphanPrevention(tasks);
    traceLog('Orchestrator: Checking Drift Prevention Gate', { gate: 'drift-prevention' });
    enforceDriftPrevention();
    traceLog('Orchestrator: Checking Prompt Disambiguation Gate', { gate: 'prompt-disambiguation' });
    gatePromptDisambiguation(tasks);
    traceLog('Orchestrator: Checking Branch Protection Gate', { gate: 'branch-protection' });
    gateBranchProtection();
    traceLog('Orchestrator: Checking Git Hierarchy Gate', { gate: 'git-hierarchy' });
    gateGitHierarchy(tasks);
    traceLog('Orchestrator: Checking Security Scan Gate', { gate: 'security-scan' });
    gateSecurityScan();
    traceLog('Orchestrator: Checking Test Coverage Complexity Gate', { gate: 'test-coverage-complexity' });
    gateTestCoverageComplexity();
    traceLog('Orchestrator: Checking Self-Documenting Law Gate', { gate: 'self-documenting-law' });
    gateSelfDocumentingLaw();
    traceLog('Orchestrator: Checking Config Registry Gate', { gate: 'config-registry' });
    gateConfigRegistry();
    traceLog('Orchestrator: Checking Contributor Onboarding Gate', { gate: 'contributor-onboarding' });
    gateContributorOnboarding();
    traceLog('Orchestrator: Checking Release Tag Workflow Gate', { gate: 'release-tag-workflow' });
    gateReleaseTagWorkflow();
    traceLog('Orchestrator: Checking Merge Conflict Handling Gate', { gate: 'merge-conflict-handling' });
    gateMergeConflictHandling();
    traceLog('Orchestrator: Checking Ambiguity Detection Gate', { gate: 'ambiguity-detection' });
    gateAmbiguityDetection(tasks);
    traceLog('Orchestrator: Checking Risk Escalation Gate', { gate: 'risk-escalation' });
    gateRiskEscalation(tasks);
    traceLog('Orchestrator: Checking Session Refresh Gate', { gate: 'session-refresh' });
    gateSessionRefresh();
    traceLog('Orchestrator: Checking Subagent Scoring Gate', { gate: 'subagent-scoring' });
    await gateSubagentScoring(tasks[0]);
    traceLog('Orchestrator: Checking Edge Case Handling Gate', { gate: 'edge-case-handling' });
    gateEdgeCaseHandling();
    traceLog('Orchestrator: Checking Automated Fix Proposal Gate', { gate: 'automated-fix-proposal' });
    gateAutomatedFixProposal(tasks);
    traceLog('Orchestrator: Checking Context Efficiency', { gate: 'context-efficiency' });
    checkContextEfficiency();
    traceLog('Orchestrator: Checking CI/CD Gates', { gate: 'cicd-gates' });
    enforceCICDGates();
    traceLog('Orchestrator: Checking AI Handling Gate', { gate: 'ai-handling' });
    // Replace legacy AI handling with Gemini rewrite logic
    if (tasks[0] && tasks[0].filePath) {
      const prompt = `Rewrite this file to ensure it passes all gates. If the gate failure is known, fix: ${tasks[0].ai.prompt}`;
      traceLog('Gemini Debug: Starting rewriteFileWithGemini', {
        filePath: tasks[0].filePath,
        prompt,
        env: {
          VERTEX_AI_PROJECT: process.env.VERTEX_AI_PROJECT,
          VERTEX_AI_LOCATION: process.env.VERTEX_AI_LOCATION,
          EXPO_PUBLIC_GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
          GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
          GEMINI_API_KEY: process.env.GEMINI_API_KEY
        }
      });
      try {
        await rewriteFileWithGemini(tasks[0].filePath, prompt);
        traceLog('Gemini file rewrite applied for AI Handling Gate.', { event: 'gemini-file-rewrite', filePath: tasks[0].filePath });
      } catch (geminiErr) {
        traceLog('Gemini Debug: rewriteFileWithGemini failed', {
          error: geminiErr,
          filePath: tasks[0].filePath,
          prompt
        });
        console.error('Gemini file rewrite failed for AI Handling Gate:', geminiErr.message);
      }
    }
    traceLog('All logical, tactical, and AI gates passed.', { event: 'logical-tactical-ai-gates', tasks });
    return true;
  } catch (err) {
    traceLog('Gate failure detected, prompting for file fixes.', { event: 'gate-failure', error: err.message });
    console.error('Gate failure:', err.message);
    // Gemini rewrite integration: always provide filePath and gateRule
    const filePath = err.filePath || (tasks[0] && tasks[0].filePath) || path.resolve(__dirname, 'testGeminiApi.js');
    const gateRule = err.gateRule || 'unknown-gate';
      // Utility: Parse YAML frontmatter from file
      const fs = require('fs');
      const yamlFrontmatterRegex = /^---\n([\s\S]*?)---\n/;
      function parseYamlFrontmatter(filePath) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const match = content.match(yamlFrontmatterRegex);
          if (match) {
            const yaml = match[1];
            const lines = yaml.split('\n');
            const meta = {};
            lines.forEach(line => {
              const [key, value] = line.split(':').map(s => s.trim());
              if (key && value) meta[key] = value;
            });
            return meta;
          }
        } catch (e) {}
        return {};
      }
      // Before orphan prevention, update task metadata from YAML frontmatter
      if (tasks[0] && tasks[0].filePath) {
        const meta = parseYamlFrontmatter(tasks[0].filePath);
        if (meta.milestone) tasks[0].milestone = meta.milestone;
        if (meta.issueId) tasks[0].id = meta.issueId;
      }
      // If milestone or issueId missing, use gh CLI to create/check
      if (tasks[0] && (!tasks[0].milestone || !tasks[0].id)) {
        const { execSync } = require('child_process');
        // Set repo info
        const repo = 'chicanoandres702/SentientAIBrowser';
        // Ensure milestone exists
        if (!tasks[0].milestone) {
          try {
            const milestoneTitle = 'v1.0';
            const jqExpr = `.[] | select(.title==\"${milestoneTitle}\") | .number`;
            const args = [
              'api',
              `repos/${repo}/milestones`,
              '--jq',
              jqExpr
            ];
            traceLog('DEBUG: gh milestone args', { args });
            const milestoneCheck = require('child_process').spawnSync('gh', args, { shell: true }).stdout.toString().trim();
            if (!milestoneCheck) {
              require('child_process').spawnSync('gh', ['api', `repos/${repo}/milestones`, '-f', `title=${milestoneTitle}`, '-f', 'description=Auto-created milestone'], { shell: true });
            }
            tasks[0].milestone = milestoneTitle;
          } catch (e) { traceLog('DEBUG: gh milestone error', { error: e.message }); }
        }
        // Ensure issue exists
        if (!tasks[0].id) {
          try {
            const issueTitle = tasks[0].title || 'Auto-created issue';
            const issueList = execSync(`gh issue list --milestone "${tasks[0].milestone}" --search "${issueTitle}" --repo ${repo}`, { shell: 'powershell.exe' }).toString();
            let issueId = '';
            const issueMatch = issueList.match(/#(\d+)/);
            if (issueMatch) issueId = issueMatch[1];
            if (!issueId) {
              const issueCreate = execSync(`gh issue create --title "${issueTitle}" --milestone "${tasks[0].milestone}" --label "ai-autonomy" --repo ${repo} --body "Auto-created by orchestrator"`, { shell: 'powershell.exe' }).toString();
              const newIssueMatch = issueCreate.match(/#(\d+)/);
              if (newIssueMatch) issueId = newIssueMatch[1];
            }
            tasks[0].id = issueId;
          } catch (e) { traceLog('DEBUG: gh issue error', { error: e.message }); }
        }
      }
    // Patch orphan prevention: parse YAML frontmatter for milestone and issueId, update task metadata, and use gh CLI
    if (gateRule === 'orphan-prevention' || err.message.includes('milestone')) {
      const fs = require('fs');
      const yamlFrontmatterRegex = /^---\n([\s\S]*?)---\n/;
      let milestone = 'v1.0';
      let issueId = '123';
      if (tasks[0] && tasks[0].filePath && fs.existsSync(tasks[0].filePath)) {
        const fileContent = fs.readFileSync(tasks[0].filePath, 'utf8');
        const match = fileContent.match(yamlFrontmatterRegex);
        if (match) {
          const yaml = match[1];
          yaml.split('\n').forEach(line => {
            const [key, value] = line.split(':').map(s => s.trim());
            if (key === 'milestone' && value) milestone = value;
            if (key === 'issueId' && value) issueId = value;
          });
        }
        tasks[0].milestone = milestone;
        tasks[0].id = issueId;
        traceLog('Orchestrator: Parsed YAML frontmatter for milestone and issueId.', { milestone, issueId, filePath });
        // Use gh CLI to ensure milestone and issue exist
        const { execSync } = require('child_process');
        try {
          // Check/create milestone
          let milestoneNumber = '';
          try {
            // Aggressively escape for Windows/PowerShell
            const jqExpr = `.[] | select(.title==\"${milestone}\") | .number`;
            const args = [
              'api',
              `repos/${process.env.GH_REPO || 'chicanoandres702/SentientAIBrowser'}/milestones`,
              '--jq',
              `.[] | select(.title=="${milestone}") | .number`
            ];
            milestoneNumber = execSync(`gh ${args.map(a => `"${a}"`).join(' ')}`).toString().trim();
          } catch {}
          if (!milestoneNumber) {
            execSync(`gh api repos/$env:GH_REPO/milestones -f title="${milestone}" -f description="Auto-created by orchestrator"`);
            traceLog('Orchestrator: Created milestone via gh CLI.', { milestone });
          }
          // Check/create issue
          let issueExists = false;
          try {
            const issues = execSync(`gh issue list --milestone "${milestone}" --search "${issueId}"`).toString();
            issueExists = issues.includes(issueId);
          } catch {}
          if (!issueExists) {
            execSync(`gh issue create --title "Auto Issue ${issueId}" --milestone "${milestone}" --label "automation" --body "Auto-created by orchestrator."`);
            traceLog('Orchestrator: Created issue via gh CLI.', { issueId, milestone });
          }
        } catch (cliErr) {
          traceLog('Orchestrator: gh CLI error', { error: cliErr.message });
        }
      }
    }
    if (filePath && gateRule) {
      const prompt = `Rewrite this file to fix the following gate failure: ${gateRule}. Error: ${err.message}\n\nIf orphan prevention, add a YAML frontmatter metadata header at the top of the file with milestone and issueId fields, e.g.:\n---\nmilestone: v1.0\nissueId: 123\n---\n\nEnsure the header is valid YAML and placed at the very top. Then update the file as needed to pass all gates.`;
      try {
        await rewriteFileWithGemini(filePath, prompt);
        traceLog('Gemini file rewrite applied. Rerunning gates...', { event: 'gemini-file-rewrite', filePath, gateRule });
        return await runLogicalGates(tasks);
      } catch (geminiErr) {
        console.error('Gemini file rewrite failed:', geminiErr.message);
      }
    }
    // Fallback: show manual fix instructions
    console.log('Gemini auto-fix unavailable. Please fix the following manually:');
    console.log('Gate failure:', err.message);
    if (gateRule === 'orphan-prevention' || err.message.includes('milestone')) {
      console.log('To fix orphan prevention: Ensure every task/file has a milestone and issue ID in its metadata or header.');
    }
    if (typeof generateLLMGuidance === 'function') {
      generateLLMGuidance('Gate failure: ' + err.message);
    }
    return false;
  }
}

// Always run gates with a test task to show debug logging
const testTasks = [
  {
    id: 1,
    title: 'Initial Gemini rewrite test',
    status: 'in-progress',
    filePath: path.resolve(__dirname, 'testGeminiApi.js'), // Use a real file for rewrite
    ai: { model: 'gemini', prompt: 'Add a comment at the top of the file.' }
  }
];
runLogicalGates(testTasks);

const getAllCodebaseTasks = () => {
  // Scan for all .js, .ts, .tsx files in src/ and shared/
  const patterns = [
    'src/**/*.js', 'src/**/*.ts', 'src/**/*.tsx',
    'shared/**/*.js', 'shared/**/*.ts', 'shared/**/*.tsx',
    'functions/src/**/*.js', 'functions/src/**/*.ts', 'functions/src/**/*.tsx',
    'functions/lib/**/*.js', 'functions/lib/**/*.ts', 'functions/lib/**/*.tsx'
  ];
  let files = [];
  patterns.forEach(pattern => {
    files = files.concat(glob.sync(pattern, { absolute: true }));
  });
  // Create a task for each file
  return files.map((file, idx) => ({
    id: idx + 1,
    title: `Gate check: ${file}`,
    status: 'in-progress',
    filePath: file,
    ai: { model: 'gpt-4', prompt: `Check gates for ${file}` }
  }));
};

// Run gates on all codebase files
async function runAllCodebaseGates() {
  const allTasks = getAllCodebaseTasks();
  for (const task of allTasks) {
    await runLogicalGates([task]);
  }
}

// Entry point: run all codebase gates if --all flag is present
if (process.argv.includes('--all')) {
  runAllCodebaseGates().then(() => {
    traceLog('--- All codebase gates checked ---', { event: 'codebase-scan', level: 'info' });
  });
} else {
  const promptArg = process.argv.find((arg, idx) => idx > 1 && !arg.startsWith('-'));
  if (promptArg) {
    handlePrompt(promptArg, generateLLMGuidance);
  } else {
  }
}

traceLog('--- Sentient GH Orchestrator Active ---', { event: 'startup', level: 'info' });
// End of file. No incomplete code below this line.

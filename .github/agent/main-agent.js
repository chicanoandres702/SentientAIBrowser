// Main Orchestrator Agent for Chain Automation
const GhOrchestratorAgent = require('./gh-orchestrator-agent');
const GeminiAgent = require('./gemini-agent');
const SoftwareArchitectAgent = require('./software-architect-agent');
const RefactorAgent = require('./refactor-agent');
const AuditAgent = require('./audit-agent');
const TestValidatorAgent = require('./test-validator-agent');
const GitHubAgent = require('./github-agent');

async function runWorkflow() {
  try {
    // 1. Project Structure & Compliance Gate
    const structure = SoftwareArchitectAgent.designProjectStructure();
    console.log('Recommended structure:', structure);
    AuditAgent.logAction('Project structure recommended', JSON.stringify(structure));

    // 2. Refactor & Code Quality Gate
    const refactorMsg = RefactorAgent.suggestRefactor('main-agent.js');
    console.log(refactorMsg);
    AuditAgent.logAction('Refactor suggestion', refactorMsg);

    // 3. Test Validation & Coverage Gate
    const testResult = TestValidatorAgent.validateTests();
    console.log(testResult);
    AuditAgent.logAction('Test validation', testResult);

    // 4. AI Code Generation & Q&A Gate
    const code = await GeminiAgent.generateCode('Create a Node.js hello world');
    console.log(code);
    AuditAgent.logAction('Gemini codegen', code);

    // 5. GitHub CLI Automation Gate
    const issueResult = GhOrchestratorAgent.createIssue('Automated Feature Request', 'Created by main-agent.js chain workflow');
    console.log(issueResult);
    AuditAgent.logAction('Issue created', issueResult);

    // 6. GitHub API Automation Gate
    const repoInfo = await GitHubAgent.getRepoInfo('chicanoandres702', 'Sentient-AI-Hub');
    console.log('Repo info:', repoInfo);
    AuditAgent.logAction('Repo info fetched', JSON.stringify(repoInfo));

    // 7. Audit Logging Gate
    AuditAgent.logAction('Main agent workflow completed', 'All gates and subagents executed');
    console.log('Main agent workflow completed successfully.');
  } catch (err) {
    AuditAgent.logAction('Main agent error', err.message || err);
    console.error('Main agent error:', err);
    process.exit(1);
  }
}

runWorkflow();

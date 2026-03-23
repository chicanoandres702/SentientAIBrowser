// Feature: Orchestrator Prompt Handling | Trace: orchestrator.prompt.js
const { traceLog } = require('./orchestrator.trace');

function handlePrompt(prompt, guidanceCallback) {
  const featureSlug = prompt.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const milestone = featureSlug;
  const issueTitle = prompt;
  const taskId = Date.now().toString();
  const branch = `feature/${milestone}`;
  const taskBranch = `${branch}/${taskId}`;
  traceLog('Prompt received', { prompt });
  const guidance = guidanceCallback(prompt);
  console.log(guidance);
  traceLog('LLM guidance generated.', { milestone, issueTitle, branch });
}

function generateLLMGuidance(prompt) {
  const featureSlug = prompt.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const milestone = featureSlug;
  const issueTitle = prompt;
  const branch = `feature/${milestone}`;
  return `\n  LLM Guidance for Feature: "${prompt}"\n\n  1. Milestone Creation:\n    - Name: ${milestone}\n    - Description: Represents the feature or major deliverable.\n    - Action: Create a GitHub milestone with this name.\n\n  2. Issue Creation:\n    - Title: ${issueTitle}\n    - Description: Describe the task, requirements, and acceptance criteria.\n    - Action: Create a GitHub issue and link it to the milestone.\n\n  3. Branch Handling:\n    - Feature Branch: ${branch}\n    - Action: Create a branch named 'feature/${milestone}' for development.\n    - For sub-tasks, use 'feature/${milestone}/{task-slug}'.\n\n  4. Gist Handling:\n    - Action: Create a GitHub Gist for code snippets, design docs, or reference material related to this feature.\n\n  5. Automation:\n    - Ensure all actions are traceable and linked (milestone <-> issue <-> branch <-> gist).\n    - Use consistent naming and update status as work progresses.\n\n  6. LLM Agent Instructions:\n    - When prompted for a feature/task, follow the above workflow.\n    - Always GET before POST to avoid duplicates.\n    - Enforce orphan prevention: every branch/issue must be mapped to a milestone.\n  `;
}

module.exports = { handlePrompt, generateLLMGuidance };

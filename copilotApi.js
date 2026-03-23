// Feature: VS Code Copilot API integration
// Why: Enables orchestrator to prompt Copilot for code suggestions and fixes
// Filepath: copilotApi.js
// Description: Provides a function to prompt Copilot in VS Code and return suggestions
// Trace: Used by orchestrator.service.js for automated code fixes


// NOTE: This file is now split for two contexts:
// 1. Orchestrator automation (Node.js, backend)
// 2. VS Code extension (frontend, Copilot API)

const fs = require('fs');
const GeminiAgent = require('./.github/agent/gemini-agent');

/**
 * promptCopilot - Sends a prompt to Copilot and returns suggestions
 * @param {string} prompt - The prompt/question for Copilot
 * @returns {Promise<string[]>} - Array of Copilot suggestions
 */
async function promptCopilot(prompt) {
  // Use GeminiAgent to generate code suggestions
  const suggestion = await GeminiAgent.generateCode(prompt);
  return [suggestion];
}

/**
 * autoFixWithCopilot - Prompts Copilot for a fix that accommodates the gate rule and applies it to the file
 * @param {string} gateRule - The gate rule description (e.g., 'Type Enforcement: models/types required')
 * @param {string} filePath - The path to the file to fix
 * @param {string} errorMsg - The error message from the gate
 * @returns {Promise<boolean>} - True if fix applied, false otherwise
 */
async function autoFixWithCopilot(gateRule, filePath, errorMsg) {
  const prompt = `Fix the file at ${filePath} to satisfy this gate rule: ${gateRule}. Error: ${errorMsg}`;
  try {
    const suggestions = await promptCopilot(prompt);
    if (!suggestions || suggestions.length === 0) throw new Error('No Gemini suggestions');
    // Use the first suggestion as the fix
    const fs = require('fs');
    fs.writeFileSync(filePath, suggestions[0], 'utf8');
    return true;
  } catch (err) {
    console.error('Gemini auto-fix failed:', err);
    return false;
  }
}

module.exports = { promptCopilot, autoFixWithCopilot };

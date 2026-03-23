// Feature: Orchestrator Docs Gate | Trace: orchestrator.gate.docs.js
const path = require('path');
const fs = require('fs');
const { traceLog } = require('./orchestrator.trace');

function gateSelfDocumentingLaw() {
  const docsDir = path.join(__dirname, 'docs', 'aidde');
  const promptsDir = path.join(__dirname, 'prompts');
  if (!fs.existsSync(docsDir) || !fs.existsSync(promptsDir)) {
    traceLog('Gate: Self-documenting law failed', { gate: 'self-documenting-law', docsDir, promptsDir });
    throw new Error('Self-documenting law gate failed: docs/aidde or prompts/ missing');
  }
  traceLog('Gate: Self-documenting law passed', { gate: 'self-documenting-law' });
  return true;
}

module.exports = { gateSelfDocumentingLaw };

// Test script for autoFixWithCopilot
const { autoFixWithCopilot } = require('./copilotApi');

(async () => {
  const gateRule = 'Type Enforcement: models/types required';
  const filePath = './src/models/SampleModel.js';
  const errorMsg = 'Type enforcement gate failed: no models/types found';
  const result = await autoFixWithCopilot(gateRule, filePath, errorMsg);
  if (result) {
    console.log('Copilot auto-fix applied successfully!');
  } else {
    console.log('Copilot auto-fix failed.');
  }
})();

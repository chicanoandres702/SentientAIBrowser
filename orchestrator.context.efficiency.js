// Feature: Orchestrator Context Efficiency | Trace: orchestrator.context.efficiency.js
const path = require('path');
const fs = require('fs');
const { traceLog } = require('./orchestrator.trace');

function checkContextEfficiency() {
  const loadedFiles = [__filename]; // Replace with actual loaded files tracking if available
  const maxFiles = 5;
  const verticalSliceDir = path.join(__dirname, 'src', 'features');
  const hasVerticalSlice = fs.existsSync(verticalSliceDir);
  const result = loadedFiles.length <= maxFiles && hasVerticalSlice;
  traceLog('Context Efficiency Check', { event: 'context-efficiency', loadedFiles, hasVerticalSlice, result });
  if (!result) throw new Error('Context Efficiency violation: Too many files loaded or missing vertical slice structure');
  return result;
}

module.exports = { checkContextEfficiency };

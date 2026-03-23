// Feature: Orchestrator Test Coverage Gate | Trace: orchestrator.gate.test.js
const path = require('path');
const fs = require('fs');
const { traceLog } = require('./orchestrator.trace');

function gateTestCoverageComplexity() {
  const testOutputFile = path.join(__dirname, 'test-output.txt');
  if (!fs.existsSync(testOutputFile)) {
    traceLog('Gate: Test output missing', { gate: 'test-coverage' });
    throw new Error('Test coverage gate failed: test output missing');
  }
  const testOutput = fs.readFileSync(testOutputFile, 'utf8');
  const coverageOk = testOutput.includes('Coverage: 80%');
  const fileLines = fs.readFileSync(__filename, 'utf8').split('\n').length;
  if (!coverageOk || fileLines > 100) {
    traceLog('Gate: Coverage or complexity failed', { gate: 'test-coverage', coverageOk, fileLines });
    throw new Error('Test coverage/complexity gate failed: coverage < 80% or file > 100 lines');
  }
  traceLog('Gate: Coverage and complexity passed', { gate: 'test-coverage', coverageOk, fileLines });
  return true;
}

module.exports = { gateTestCoverageComplexity };

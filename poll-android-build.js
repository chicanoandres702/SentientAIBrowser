#!/usr/bin/env node


const { spawn, execSync } = require('child_process');
const scriptName = process.argv[2] || 'android';
const chalk = require('chalk');



function hasAdbDevice() {
  try {
    const result = execSync('adb devices', { encoding: 'utf8' });
    const lines = result.split('\n').filter(l => l.trim() && !l.includes('List of devices'));
    return lines.length > 0;
  } catch (e) {
    return false;
  }
}

function isCI() {
  return process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
}

console.log(`OBJECTIVE: Build the project using 'npm run ${scriptName}' and report the result.`);

function parseError(errorOutput) {
  // Custom error parsing for AI handling
  let trace = [];
  let errorType = 'Unknown';
  let diagnostics = [];
  if (/AGGREGATEERROR/i.test(errorOutput)) {
    errorType = 'AggregateError';
    diagnostics.push('Node.js network error detected. Possible causes: Emulator not running, network misconfiguration, or Expo/Metro unable to connect.');
    if (/emulator.*quit/i.test(errorOutput)) {
      diagnostics.push('Android emulator quit before finishing. Try starting the emulator manually.');
    }
  }
  if (/jest.*expected version/i.test(errorOutput)) {
    errorType = 'DependencyVersionMismatch';
    diagnostics.push('Dependency version mismatch detected. Run `npx expo install` to fix.');
  }
  // Add more practical checks as needed
  trace.push(`ERROR_TYPE: ${errorType}`);
  trace.push('RAW_ERROR:');
  trace.push(errorOutput.split('\n').slice(-10).join(' '));
  if (diagnostics.length) {
    trace.push('DIAGNOSTICS:');
    diagnostics.forEach(d => trace.push('- ' + d));
  }
  return trace.join('\n');
}

function runScript() {
  // Always run 'npm run android' with logs suppressed
  const proc = spawn('npm', ['run', 'android'], { shell: true });
  let errorOutput = '';
  let failCount = 0;
  proc.stdout && proc.stdout.on('data', data => {
    // Suppress all stdout
  });
  proc.stderr && proc.stderr.on('data', data => {
    errorOutput += data.toString();
    // Suppress all stderr
  });
  proc.on('exit', (code) => {
    if (code === 0) {
      // Success: print APK location
      console.log(chalk.green.bold('NO PROBLEM: APK created at android/app/build/outputs/apk/release/app-release.apk'));
      process.exit(0);
    } else {
      failCount++;
      // Generalized error and extended stack trace
      let problemMsg = 'PROBLEM DETECTED';
      let stackTrace = '';
      if (errorOutput) {
        const firstLine = errorOutput.split('\n')[0];
        problemMsg += ': ' + firstLine;
        // Extended stack trace (last 20 lines)
        stackTrace = errorOutput.split('\n').slice(-20).join('\n');
      }
      console.log(chalk.red.bold(problemMsg.toUpperCase()));
      if (stackTrace) {
        console.log(chalk.yellow.bold('STACK TRACE (last 20 lines):'));
        console.log(stackTrace);
      }
      // Print actionable diagnostics
      const diagnostics = parseError(errorOutput);
      if (diagnostics) {
        console.log(chalk.cyan.bold('DIAGNOSTICS:'));
        console.log(diagnostics);
      }
      // Write full error output to log file for deep debugging
      const fs = require('fs');
      fs.writeFileSync('android-build-error.log', errorOutput, { encoding: 'utf8' });
      console.log(chalk.magenta('Full error output written to android-build-error.log'));
      // Stop after 3 consecutive failures
      if (failCount >= 3) {
        console.log(chalk.red.bold('FAILED 3 TIMES. EXITING. See android-build-error.log for details.'));
        process.exit(1);
      }
      // Wait 10 seconds, then rerun
      setTimeout(runScript, 10000);
    }
  });
}

runScript();

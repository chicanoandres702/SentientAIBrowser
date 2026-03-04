#!/usr/bin/env node
const { spawn } = require('child_process');

const POLL_INTERVAL = 10000; // 10 seconds
let running = true;

function runAndroid() {
  const proc = spawn('npm', ['run', 'android'], { stdio: 'inherit', shell: true });
  proc.on('exit', (code) => {
    if (code === 0) {
      console.log('Build finished successfully.');
      running = false;
    } else {
      console.log(`Build exited with code ${code}. Polling again in 10 seconds...`);
      setTimeout(() => {
        if (running) runAndroid();
      }, POLL_INTERVAL);
    }
  });
}

runAndroid();

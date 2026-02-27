// Feature: System Utilities | Trace: README.md
const path = require('path');
const { chromium } = require('playwright');

const PORT = 3000;
const TASKS_FILE = path.join(__dirname, 'tasks.json');

let browserInstance = null;

async function getBrowser() {
  if (!browserInstance) {
    browserInstance = await chromium.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }
  return browserInstance;
}

function stripSecurityHeaders(res) {
  res.removeHeader('X-Frame-Options');
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('Content-Security-Policy-Report-Only');
  res.removeHeader('X-Content-Type-Options');
}

module.exports = {
  PORT,
  TASKS_FILE,
  getBrowser,
  stripSecurityHeaders
};

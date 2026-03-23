// Feature: Backend URL Automation | Trace: scripts/set-backend-url.js
// Sentient AI Browser Backend URL Automation Script
// Why: Ensures correct backend URL is set for Cloud Run, Firebase Hosting, and local dev
// Usage: node scripts/set-backend-url.js <env>
// <env>: 'cloudrun', 'firebase', 'local'

const fs = require('fs');
const path = require('path');

const env = process.argv[2] || 'local';
const envUtilsPath = path.join(__dirname, '../shared/env.utils.ts');

const productionProxy = 'https://sentient-proxy-184717935920.us-central1.run.app';
const localProxy = 'http://localhost:3000';
const androidProxy = 'http://10.0.2.2:3000';

function updateEnvUtils(proxyUrl) {
  let content = fs.readFileSync(envUtilsPath, 'utf8');
  content = content.replace(/const productionProxy = '.*?';/, `const productionProxy = '${proxyUrl}';`);
  content = content.replace(/const localProxy = Platform\.OS === 'android' \? 'http:\/\/10.0.2.2:3000' : 'http:\/\/localhost:3000';/, `const localProxy = Platform.OS === 'android' ? '${androidProxy}' : '${localProxy}';`);
  fs.writeFileSync(envUtilsPath, content, 'utf8');
  console.log(`[set-backend-url] Updated proxyBaseUrl to ${proxyUrl}`);
}

if (env === 'cloudrun') {
  updateEnvUtils(productionProxy);
} else if (env === 'firebase') {
  updateEnvUtils(productionProxy);
} else {
  updateEnvUtils(localProxy);
}

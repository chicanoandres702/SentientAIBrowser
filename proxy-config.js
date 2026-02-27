// Feature: System Utilities | Trace: README.md
const path = require('path');
const { chromium } = require('playwright');
const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');

// Hardcoded for simplicity in proxy environment matching App.tsx
const firebaseConfig = {
    apiKey: "AIzaSyBOLfwvlZfE3tVFqX3AbVwP1ef-vR1M4jA",
    authDomain: "sentient-ai-browser.firebaseapp.com",
    projectId: "sentient-ai-browser",
    storageBucket: "sentient-ai-browser.firebasestorage.app",
    messagingSenderId: "184717935920",
    appId: "1:184717935920:web:f3810db4ba6755f08a34f5",
    measurementId: "G-12D6HTCRD6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
  stripSecurityHeaders,
  db
};

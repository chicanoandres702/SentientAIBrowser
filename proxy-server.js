// Feature: System Utilities | Trace: README.md
const express = require('express');
const cors = require('cors');
const { PORT } = require('./proxy-config');
const { setupTaskRoutes } = require('./proxy-routes-tasks');
const { setupBrowserRoutes } = require('./proxy-routes-browser');

/**
 * Sentinel AI Browser Proxy Server
 * Note: The cluster module was removed for local development stability.
 * It introduced unnecessary complexity and potential resource conflicts that can cause build processes to hang.
 * For production, a process manager like PM2 or native clustering can be reintroduced if needed.
 */
const app = express();

// Why: The json parser middleware must only be applied to routes that expect a JSON body.
// The /proxy/forward route needs to handle the raw request body, so the global
// express.json() middleware was causing a "body already read" error.
// The cors() middleware is also applied here to avoid global conflicts with other processes.
const jsonParser = express.json();
app.use('/proxy/tasks', cors(), jsonParser, setupTaskRoutes());

// Why: The Puppeteer-based browser proxy is more robust for modern web apps.
// It handles complex JS, AJAX, and security policies better than simple HTTP proxies.
setupBrowserRoutes(app);

const orchestrator = require('./backend-ai-orchestrator');

app.listen(PORT, () => {
  console.log(`[Sentient Proxy] Active at http://localhost:${PORT}`);
  orchestrator.start();
});

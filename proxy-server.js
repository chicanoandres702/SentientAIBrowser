// Feature: System Utilities | Trace: README.md
const express = require('express');
const cors = require('cors');
const { PORT } = require('./proxy-config');
const { setupTaskRoutes } = require('./proxy-routes-tasks');
const { setupGitRoutes } = require('./proxy-routes-git');
const { setupBrowserRoutes } = require('./proxy-routes-browser');

/**
 * Sentinel AI Browser Proxy Server
 * Note: The cluster module was removed for local development stability.
 * It introduced unnecessary complexity and potential resource conflicts that can cause build processes to hang.
 * For production, a process manager like PM2 or native clustering can be reintroduced if needed.
 */
const app = express();
app.use(cors());

// Why: The json parser middleware must only be applied to routes that expect a JSON body.
// The /proxy/forward route needs to handle the raw request body, so the global
// express.json() middleware was causing a "body already read" error.
const jsonParser = express.json();
app.use('/proxy/tasks', jsonParser, setupTaskRoutes());
app.use('/git/commit', jsonParser, setupGitRoutes());

setupBrowserRoutes(app);

app.listen(PORT, () => {
  console.log(`[Sentient Proxy] Active at http://localhost:${PORT}`);
});

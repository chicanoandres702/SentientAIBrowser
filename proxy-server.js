// Feature: System Utilities | Trace: README.md
const express = require('express');
const cors = require('cors');
const { PORT } = require('./proxy-config');
const { setupTaskRoutes } = require('./proxy-routes-tasks');
const { setupGitRoutes } = require('./proxy-routes-git');
const { setupBrowserRoutes } = require('./proxy-routes-browser');

/**
 * Sentinel AI Browser Proxy Server
 * Modularized for AI Token Density Compliance.
 */
const app = express();

app.use(cors());
app.use(express.json());

// Initialize Satellite Routes
setupTaskRoutes(app);
setupGitRoutes(app);
setupBrowserRoutes(app);

app.listen(PORT, () => {
  console.log(`Sentient Proxy running at http://localhost:${PORT}`);
});

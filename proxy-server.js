// Feature: System Utilities | Trace: README.md
const cluster = require('cluster');
const os = require('os');
const express = require('express');
const cors = require('cors');
const { PORT } = require('./proxy-config');
const { setupTaskRoutes } = require('./proxy-routes-tasks');
const { setupGitRoutes } = require('./proxy-routes-git');
const { setupBrowserRoutes } = require('./proxy-routes-browser');

/**
 * Sentinel AI Browser Proxy Server
 * Multithreaded Cluster Architecture for Horizontal Scaling.
 */
if (cluster.isMaster) {
  const numCPUs = os.cpus().length;
  console.log(`[Sentient Master] Forking ${numCPUs} proxy workers...`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker) => {
    console.log(`[Sentient Master] Worker ${worker.process.pid} died. Respawning...`);
    cluster.fork();
  });
} else {
  const app = express();
  app.use(cors());
  app.use(express.json());

  setupTaskRoutes(app);
  setupGitRoutes(app);
  setupBrowserRoutes(app);

  app.listen(PORT, () => {
    console.log(`[Worker ${process.pid}] Sentient Proxy active at http://localhost:${PORT}`);
  });
}

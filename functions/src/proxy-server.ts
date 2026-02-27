// Feature: System Utilities | Trace: README.md
import express from 'express';
import cors from 'cors';
import { PORT } from './proxy-config';
import { setupBrowserRoutes } from './proxy-routes-browser';
import orchestrator from './backend-ai-orchestrator';

/**
 * Sentinel AI Browser Proxy Server
 * Note: The cluster module was removed for local development stability.
 * It introduced unnecessary complexity and potential resource conflicts that can cause build processes to hang.
 * For production, a process manager like PM2 or native clustering can be reintroduced if needed.
 */
const app = express();
app.use(cors());
app.use(express.json());

// Why: The Puppeteer-based browser proxy is more robust for modern web apps.
// It handles complex JS, AJAX, and security policies better than simple HTTP proxies.
setupBrowserRoutes(app);

app.listen(PORT, () => {
  console.log(`[Sentient Proxy] Active at http://localhost:${PORT}`);
  orchestrator.start();
});

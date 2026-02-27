import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import cors from "cors";
import { setupBrowserRoutes } from "./proxy-routes-browser";
import orchestrator from "./backend-ai-orchestrator";

const app = express();
app.use(cors({ origin: true }));

// Reuse existing proxy logic
setupBrowserRoutes(app);

// Initialize Backend AI Orchestrator
orchestrator.start();

export const sentientProxy = onRequest({
  memory: "2GiB", // Required for Puppeteer/Playwright
  timeoutSeconds: 300,
  cpu: 1,
}, app);

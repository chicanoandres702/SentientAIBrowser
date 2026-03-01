// Feature: Functions Entry | Trace: README.md
import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import cors from "cors";
import { setupBrowserRoutes } from "./proxy-routes-browser";

const app = express();
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'X-Gemini-Api-Key'],
}));
app.options('*', (_req, res) => res.sendStatus(204));
app.use(express.json({ limit: '2mb' }));

// Reuse existing proxy logic
setupBrowserRoutes(app);

export const sentientProxy = onRequest({
  memory: "2GiB",
  timeoutSeconds: 300,
  cpu: 1,
}, app);

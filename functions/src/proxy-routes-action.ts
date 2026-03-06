/**
 * Sentient File Header
 * Why: Sets up browser proxy action routes for Sentient AI Browser
 * Filepath: functions/src/proxy-routes-action.ts
 * Description: Handles Express routes for browser actions, tab sync, and DOM mapping
 * Trace: Used by proxy server, orchestrator, and browser sync modules
 * Wiring: Exported route setup functions, consumed by Express app and orchestrator
 */
// Feature: Browser | Trace: functions/src/proxy-routes-action.ts
// import { Express } from 'express';
// import { getPersistentPage, activePages, captureAndSyncTab, saveSessionForTab } from './proxy-page-handler';
// import { applyCorsHeaders, resolvePage } from './proxy-route.utils';
// import { getCachedFrame } from './proxy-tab-sync.broker';
// import { buildDomMap } from './proxy-dom-map';
// import { executeAriaAction } from './features/playwright-mcp';
// Barrel export for proxy route setup functions
export { setupActionRoute } from './proxy-route.action';
export { setupScreenshotRoute } from './proxy-route.screenshot';
export { setupScreenshotStreamRoute } from './proxy-route.screenshot-stream';
export { setupCoordClickRoute } from './proxy-route.coord-click';
export { setupDomMapRoute } from './proxy-route.dom-map';
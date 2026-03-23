"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupDomMapRoute = exports.setupCoordClickRoute = exports.setupScreenshotStreamRoute = exports.setupScreenshotRoute = exports.setupActionRoute = void 0;
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
var proxy_route_action_1 = require("./proxy-route.action");
Object.defineProperty(exports, "setupActionRoute", { enumerable: true, get: function () { return proxy_route_action_1.setupActionRoute; } });
var proxy_route_screenshot_1 = require("./proxy-route.screenshot");
Object.defineProperty(exports, "setupScreenshotRoute", { enumerable: true, get: function () { return proxy_route_screenshot_1.setupScreenshotRoute; } });
var proxy_route_screenshot_stream_1 = require("./proxy-route.screenshot-stream");
Object.defineProperty(exports, "setupScreenshotStreamRoute", { enumerable: true, get: function () { return proxy_route_screenshot_stream_1.setupScreenshotStreamRoute; } });
var proxy_route_coord_click_1 = require("./proxy-route.coord-click");
Object.defineProperty(exports, "setupCoordClickRoute", { enumerable: true, get: function () { return proxy_route_coord_click_1.setupCoordClickRoute; } });
var proxy_route_dom_map_1 = require("./proxy-route.dom-map");
Object.defineProperty(exports, "setupDomMapRoute", { enumerable: true, get: function () { return proxy_route_dom_map_1.setupDomMapRoute; } });
//# sourceMappingURL=proxy-routes-action.js.map
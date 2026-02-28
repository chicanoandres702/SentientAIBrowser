"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Feature: System Utilities | Trace: README.md
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const proxy_config_1 = require("./proxy-config");
const proxy_routes_browser_1 = require("./proxy-routes-browser");
const backend_ai_orchestrator_1 = __importDefault(require("./backend-ai-orchestrator"));
/**
 * Sentinel AI Browser Proxy Server
 * Note: The cluster module was removed for local development stability.
 * It introduced unnecessary complexity and potential resource conflicts that can cause build processes to hang.
 * For production, a process manager like PM2 or native clustering can be reintroduced if needed.
 */
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Why: The Puppeteer-based browser proxy is more robust for modern web apps.
// It handles complex JS, AJAX, and security policies better than simple HTTP proxies.
(0, proxy_routes_browser_1.setupBrowserRoutes)(app);
app.listen(proxy_config_1.PORT, () => {
    console.log(`[Sentient Proxy] Active at http://localhost:${proxy_config_1.PORT}`);
    try {
        backend_ai_orchestrator_1.default.start();
    }
    catch (e) {
        console.warn(`[Sentient Proxy] Orchestrator skipped (${e.message}). Proxy routes still available.`);
    }
});
//# sourceMappingURL=proxy-server.js.map
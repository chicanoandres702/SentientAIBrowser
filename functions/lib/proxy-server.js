"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Feature: System Utilities | Trace: README.md
const http = __importStar(require("http"));
const net = __importStar(require("net"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const proxy_config_1 = require("./proxy-config");
const proxy_routes_browser_1 = require("./proxy-routes-browser");
const backend_ai_orchestrator_1 = __importDefault(require("./backend-ai-orchestrator"));
/**
 * Sentinel AI Browser Proxy Server
 * Note: The cluster module was removed for local development stability.
 */
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS')
        return res.sendStatus(204);
    return next();
});
app.use(express_1.default.json());
(0, proxy_routes_browser_1.setupBrowserRoutes)(app);
// Why: use http.createServer so we can intercept WebSocket upgrade events.
// Express's app.listen() doesn't expose the raw server needed for WS proxying.
const server = http.createServer(app);
/**
 * CDP WebSocket Proxy — /cdp-proxy/<path>
 * Why: Cloud Run only exposes port 8080 (HTTPS). Chrome's CDP runs on 9222 inside the
 * container. This handler raw-tunnels WebSocket upgrade frames from the public HTTPS
 * endpoint to localhost:9222 — making the Playwright session inspectable from any browser.
 *
 * Usage (desktop):  chrome://inspect → Configure → add <cloudrun-host>:443
 * Usage (mobile):   open the devtoolsUrl returned by GET /cdp/info in any browser
 */
server.on('upgrade', (req, socket, head) => {
    var _a;
    if (!((_a = req.url) === null || _a === void 0 ? void 0 : _a.startsWith('/cdp-proxy'))) {
        socket.destroy();
        return;
    }
    // Strip our proxy prefix so CDP gets the path it expects (e.g. /devtools/page/<id>)
    const cdpPath = req.url.replace('/cdp-proxy', '') || '/';
    const target = net.createConnection(proxy_config_1.REMOTE_DEBUGGING_PORT, '127.0.0.1');
    target.on('connect', () => {
        // Rebuild the HTTP upgrade request for the CDP server
        const headers = [
            `GET ${cdpPath} HTTP/1.1`,
            `Host: 127.0.0.1:${proxy_config_1.REMOTE_DEBUGGING_PORT}`,
            `Upgrade: websocket`,
            `Connection: Upgrade`,
            ...Object.entries(req.headers)
                .filter(([k]) => !['host', 'upgrade', 'connection'].includes(k.toLowerCase()))
                .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`),
            '',
            '',
        ].join('\r\n');
        target.write(headers);
        if (head === null || head === void 0 ? void 0 : head.length)
            target.write(head);
    });
    socket.pipe(target);
    target.pipe(socket);
    socket.on('error', () => target.destroy());
    socket.on('end', () => target.destroy());
    target.on('error', (e) => {
        console.warn('[CDP Proxy] tunnel error:', e.message);
        socket.destroy();
    });
    target.on('end', () => socket.destroy());
});
server.listen(proxy_config_1.PORT, () => {
    console.log(`[Sentient Proxy] Active at http://localhost:${proxy_config_1.PORT}`);
    console.log(`[CDP] DevTools available at GET /cdp/info after first navigation`);
    try {
        backend_ai_orchestrator_1.default.start();
    }
    catch (e) {
        console.warn(`[Sentient Proxy] Orchestrator skipped (${e.message}). Proxy routes still available.`);
    }
});
//# sourceMappingURL=proxy-server.js.map
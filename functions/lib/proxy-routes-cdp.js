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
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupCdpRoutes = setupCdpRoutes;
const http = __importStar(require("http"));
const proxy_config_1 = require("./proxy-config");
const proxy_route_utils_1 = require("./proxy-route.utils");
const CDP_BASE = `http://127.0.0.1:${proxy_config_1.REMOTE_DEBUGGING_PORT}`;
/** Proxy a local CDP HTTP endpoint and return its JSON.
 *  Calls getBrowser() first so Chrome is guaranteed to be running. */
async function proxyJson(path) {
    await (0, proxy_config_1.getBrowser)(); // Ensure Chrome launched with --remote-debugging-port before querying
    return new Promise((resolve, reject) => {
        http.get(`${CDP_BASE}${path}`, (res) => {
            let body = '';
            res.on('data', (d) => body += d);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                }
                catch (_a) {
                    reject(new Error('Invalid JSON from CDP'));
                }
            });
        }).on('error', reject);
    });
}
/**
 * GET /cdp/info
 * Returns the CDP WebSocket URL, a DevTools-frontend link you can open in any browser,
 * and the list of live pages. The DevTools link works on desktop Chrome/Edge (paste into
 * address bar) and on any device via the hosted devtools frontend URL.
 *
 * WHY CDP MATTERS:
 *   Playwright uses CDP internally to control Chrome. Exposing port 9222 and proxying
 *   its WebSocket through the Cloud Run HTTPS endpoint means you can connect your own
 *   browser to the SAME Chromium instance Playwright is driving — letting you manually
 *   complete CAPTCHAs, MFA prompts, or any challenge without losing the session.
 *
 * ANDROID EDGE / ANY MOBILE BROWSER:
 *   Mobile browsers can't run chrome://inspect, but they CAN open the hosted DevTools
 *   frontend which is just a React app. Copy the "devtoolsFrontendUrl" from any page
 *   entry and replace the ws= param with the Cloud Run wss= URL shown in this response.
 */
function setupCdpRoutes(app) {
    app.get('/cdp/info', async (_req, res) => {
        var _a;
        (0, proxy_route_utils_1.applyCorsHeaders)(res);
        try {
            const [version, pages] = await Promise.all([
                proxyJson('/json/version'),
                proxyJson('/json'),
            ]);
            // Replace localhost WS endpoints with Cloud Run-routable paths
            const host = _req.headers.host || '';
            const protocol = _req.headers['x-forwarded-proto'] === 'https' ? 'wss' : 'ws';
            const mappedPages = pages.map((p) => {
                var _a, _b, _c;
                const tabPath = (_a = p.webSocketDebuggerUrl) === null || _a === void 0 ? void 0 : _a.replace(`ws://127.0.0.1:${proxy_config_1.REMOTE_DEBUGGING_PORT}`, `${protocol}://${host}/cdp-proxy`);
                // DevTools frontend URL — paste into Chrome address bar, or open on mobile
                const devtoolsUrl = tabPath
                    ? `https://chrome-devtools-frontend.appspot.com/serve_rev/@${((_c = (_b = version.webSocketDebuggerUrl) === null || _b === void 0 ? void 0 : _b.match(/@([^/]+)/)) === null || _c === void 0 ? void 0 : _c[1]) || 'HEAD'}/inspector.html?${protocol}=${tabPath.replace(/^wss?:\/\//, '')}`
                    : null;
                return { id: p.id, title: p.title, url: p.url, tabWsUrl: tabPath, devtoolsUrl };
            });
            res.json({
                browserVersion: version['Browser'],
                protocolVersion: version['Protocol-Version'],
                // Direct WS endpoint for the whole browser (chrome://inspect uses this)
                browserWsUrl: (_a = version.webSocketDebuggerUrl) === null || _a === void 0 ? void 0 : _a.replace(`ws://127.0.0.1:${proxy_config_1.REMOTE_DEBUGGING_PORT}`, `${protocol}://${host}/cdp-proxy`),
                cdpProxyPath: `/cdp-proxy`,
                pages: mappedPages,
                instructions: {
                    desktop: 'In Chrome/Edge: open chrome://inspect → Configure → add your Cloud Run host:443',
                    mobile: 'Open the devtoolsUrl from any page entry in your mobile browser',
                },
            });
        }
        catch (e) {
            res.status(503).json({ error: 'CDP not ready — browser may still be launching', detail: e.message });
        }
    });
    // Raw CDP JSON passthrough — chrome://inspect polls these
    app.get('/cdp/json', async (_req, res) => {
        (0, proxy_route_utils_1.applyCorsHeaders)(res);
        try {
            res.json(await proxyJson('/json'));
        }
        catch (e) {
            res.status(503).json({ error: e.message });
        }
    });
    app.get('/cdp/json/version', async (_req, res) => {
        (0, proxy_route_utils_1.applyCorsHeaders)(res);
        try {
            res.json(await proxyJson('/json/version'));
        }
        catch (e) {
            res.status(503).json({ error: e.message });
        }
    });
}
//# sourceMappingURL=proxy-routes-cdp.js.map
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
exports.CHROME_DEFAULT_ARGS = exports.CHROME_STEALTH_ARGS = exports.REMOTE_DEBUGGING_PORT = exports.CHROME_PERF_ARGS = exports.CHROME_SANDBOX_ARGS = exports.PORT = exports.auth = exports.db = void 0;
exports.isPortInUse = isPortInUse;
exports.getBrowser = getBrowser;
exports.stripSecurityHeaders = stripSecurityHeaders;
// Feature: System Utilities | Trace: README.md
// Technique: browser-use/web-ui — named Chrome arg constants + port conflict detection (BrowserConfig)
const net = __importStar(require("net"));
const playwright_1 = require("playwright");
const firebase_config_1 = require("./auth/firebase-config");
Object.defineProperty(exports, "db", { enumerable: true, get: function () { return firebase_config_1.db; } });
Object.defineProperty(exports, "auth", { enumerable: true, get: function () { return firebase_config_1.auth; } });
// Cloud Run injects PORT env var. Fallback to 3000 for local dev.
exports.PORT = parseInt(process.env.PORT || '3000', 10);
/**
 * Chrome args required for running headless in sandboxed/container environments.
 * Separated by concern so they can be selectively included or overridden.
 * Technique: browser-use/web-ui BrowserConfig chromium_args pattern.
 */
exports.CHROME_SANDBOX_ARGS = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage', // use /tmp instead of /dev/shm (limited in containers)
    '--no-zygote', // Docker containers lack the Linux capabilities the zygote needs
];
exports.CHROME_PERF_ARGS = [
    '--disable-gpu',
    // Why: --single-process was removed — it collapses renderer+browser into one OS process,
    // causing 'Target page, context or browser has been closed' crashes when creating
    // new BrowserContexts. Multi-process mode is stable with --no-zygote + --no-sandbox.
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-default-apps',
    '--disable-sync',
    '--disable-translate',
    '--mute-audio',
];
/** Remote debugging port — must be declared before CHROME_STEALTH_ARGS uses it */
exports.REMOTE_DEBUGGING_PORT = 9222;
/** Anti-fingerprinting args — from browser-use/web-ui stealth patterns */
exports.CHROME_STEALTH_ARGS = [
    '--disable-blink-features=AutomationControlled',
    '--disable-infobars',
    '--window-size=1280,800',
    '--disable-web-security', // allow cross-origin iframes
    '--ignore-certificate-errors',
    `--remote-debugging-port=${exports.REMOTE_DEBUGGING_PORT}`, // Why: expose CDP so humans can connect via DevTools
];
exports.CHROME_DEFAULT_ARGS = [
    ...exports.CHROME_SANDBOX_ARGS,
    ...exports.CHROME_PERF_ARGS,
    ...exports.CHROME_STEALTH_ARGS,
];
/**
 * Checks whether a TCP port is already in use.
 * Technique: browser-use/web-ui — port conflict detection before launching custom browser.
 */
function isPortInUse(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', (err) => {
            resolve(err.code === 'EADDRINUSE');
        });
        server.once('listening', () => {
            server.close();
            resolve(false);
        });
        server.listen(port, '127.0.0.1');
    });
}
let browserInstance = null;
// Why: Launch lock prevents concurrent requests from each spawning a Chrome process.
// Without this, two simultaneous calls while browserInstance=null both try chromium.launch()
// and the second Chrome fails to bind --remote-debugging-port=9222 → 180s timeout → proxy down.
let launchInProgress = null;
async function getBrowser() {
    if (browserInstance === null || browserInstance === void 0 ? void 0 : browserInstance.isConnected())
        return browserInstance;
    // If a launch is already in flight, wait for it instead of starting another
    if (launchInProgress)
        return launchInProgress;
    launchInProgress = (async () => {
        try {
            browserInstance = await playwright_1.chromium.launch({
                headless: true,
                args: [...exports.CHROME_DEFAULT_ARGS],
            });
            console.log('[Proxy] Browser launched successfully');
            return browserInstance;
        }
        finally {
            launchInProgress = null; // Release lock whether launch succeeded or failed
        }
    })();
    return launchInProgress;
}
function stripSecurityHeaders(res) {
    res.removeHeader('X-Frame-Options');
    res.removeHeader('Content-Security-Policy');
    res.removeHeader('Content-Security-Policy-Report-Only');
    res.removeHeader('X-Content-Type-Options');
}
//# sourceMappingURL=proxy-config.js.map
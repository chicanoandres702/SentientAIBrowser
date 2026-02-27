"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PORT = exports.auth = exports.db = void 0;
exports.getBrowser = getBrowser;
exports.stripSecurityHeaders = stripSecurityHeaders;
// Feature: System Utilities | Trace: README.md
const playwright_1 = require("playwright");
const firebase_config_1 = require("./auth/firebase-config");
Object.defineProperty(exports, "db", { enumerable: true, get: function () { return firebase_config_1.db; } });
Object.defineProperty(exports, "auth", { enumerable: true, get: function () { return firebase_config_1.auth; } });
// Why: In the Local-First Hybrid model, the browser proxy runs on localhost:3000.
exports.PORT = 3000;
let browserInstance = null;
async function getBrowser() {
    if (!browserInstance) {
        browserInstance = await playwright_1.chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    }
    return browserInstance;
}
function stripSecurityHeaders(res) {
    res.removeHeader('X-Frame-Options');
    res.removeHeader('Content-Security-Policy');
    res.removeHeader('Content-Security-Policy-Report-Only');
    res.removeHeader('X-Content-Type-Options');
}
//# sourceMappingURL=proxy-config.js.map
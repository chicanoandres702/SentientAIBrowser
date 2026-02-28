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
// Cloud Run injects PORT env var. Fallback to 3000 for local dev.
exports.PORT = parseInt(process.env.PORT || '3000', 10);
let browserInstance = null;
async function getBrowser() {
    if (!browserInstance || !browserInstance.isConnected()) {
        browserInstance = await playwright_1.chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage', // use /tmp instead of /dev/shm (small in containers)
                '--disable-gpu',
                '--single-process', // reduce memory footprint
                '--no-zygote', // required with --single-process in containers
                '--disable-extensions',
                '--disable-background-networking',
                '--disable-default-apps',
                '--disable-sync',
                '--disable-translate',
                '--mute-audio',
            ]
        });
        console.log('[Proxy] Browser launched successfully');
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
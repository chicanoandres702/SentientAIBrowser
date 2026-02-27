"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sentientProxy = void 0;
const https_1 = require("firebase-functions/v2/https");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const proxy_routes_browser_1 = require("./proxy-routes-browser");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: true }));
// Reuse existing proxy logic
(0, proxy_routes_browser_1.setupBrowserRoutes)(app);
exports.sentientProxy = (0, https_1.onRequest)({
    memory: "2GiB",
    timeoutSeconds: 300,
    cpu: 1,
}, app);
//# sourceMappingURL=index-app.js.map
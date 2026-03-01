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
exports.sessionFilePath = sessionFilePath;
exports.loadSession = loadSession;
exports.saveSession = saveSession;
// Feature: System Utilities | Trace: proxy-page-handler.ts
// Why: 3-tier session persistence —
//   Tier 1: in-memory Map  (zero I/O, per-container-instance request)
//   Tier 2: /tmp/sentient-sessions/{userId}.json  (per-user disk path, survives within container)
//   Tier 3: Firestore user_sessions/{userId}  (cross-instance, cross-restart ground truth)
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const proxy_config_1 = require("./proxy-config");
// Why: /tmp is the only writable directory on Cloud Run and survives for the container lifetime
const SESSION_DIR = '/tmp/sentient-sessions';
// In-memory cache: fastest path, avoids disk I/O for repeated same-container requests
const memCache = new Map();
/** Stable, user-scoped file path inside the container */
function sessionFilePath(userId) {
    return path.join(SESSION_DIR, `${userId}.json`);
}
async function loadSession(userId) {
    var _a;
    if (!userId || userId === 'default')
        return undefined;
    // Tier 1 — in-memory (same container, no I/O)
    if (memCache.has(userId)) {
        console.log(`[Session] ⚡ In-memory hit for ${userId}`);
        return memCache.get(userId);
    }
    // Tier 2 — local /tmp disk (fast, same container across requests)
    try {
        const filePath = sessionFilePath(userId);
        if (fs.existsSync(filePath)) {
            const state = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            memCache.set(userId, state);
            console.log(`[Session] 📁 Disk hit for ${userId}: ${filePath}`);
            return state;
        }
    }
    catch ( /* fall through to Firestore */_b) { /* fall through to Firestore */ }
    // Tier 3 — Firestore (cold start / new container instance)
    try {
        const snap = await proxy_config_1.db.collection('user_sessions').doc(userId).get();
        if (!snap.exists)
            return undefined;
        const state = (_a = snap.data()) === null || _a === void 0 ? void 0 : _a.storageState;
        if (state) {
            memCache.set(userId, state);
            _writeToDisk(userId, state); // prime local cache for next request
            console.log(`[Session] ☁️ Firestore cold-start restore for ${userId}`);
        }
        return state;
    }
    catch (e) {
        console.error(`[Session] Load failed for ${userId}:`, e.message);
        return undefined;
    }
}
async function saveSession(userId, context) {
    if (!userId || userId === 'default')
        return;
    try {
        const storageState = await context.storageState();
        memCache.set(userId, storageState); // Tier 1 — instant
        _writeToDisk(userId, storageState); // Tier 2 — fast
        await proxy_config_1.db.collection('user_sessions').doc(userId).set(// Tier 3 — durable
        { storageState, updated_at: new Date().toISOString() }, { merge: true });
    }
    catch (e) {
        console.error(`[Session] Save failed for ${userId}:`, e.message);
    }
}
/** Synchronous disk write — called from hot paths where await would stall. */
function _writeToDisk(userId, state) {
    try {
        fs.mkdirSync(SESSION_DIR, { recursive: true });
        fs.writeFileSync(sessionFilePath(userId), JSON.stringify(state));
    }
    catch ( /* non-fatal — Firestore is the durable fallback */_a) { /* non-fatal — Firestore is the durable fallback */ }
}
//# sourceMappingURL=proxy-session.service.js.map
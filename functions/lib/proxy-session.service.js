"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSession = loadSession;
exports.saveSession = saveSession;
const proxy_config_1 = require("./proxy-config");
const firestore_1 = require("firebase/firestore");
async function loadSession(userId) {
    if (!userId || userId === 'default')
        return undefined;
    try {
        const snap = await (0, firestore_1.getDoc)((0, firestore_1.doc)(proxy_config_1.db, 'user_sessions', userId));
        return snap.exists() ? snap.data().storageState : undefined;
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
        await (0, firestore_1.setDoc)((0, firestore_1.doc)(proxy_config_1.db, 'user_sessions', userId), { storageState, updated_at: new Date().toISOString() });
    }
    catch (e) {
        console.error(`[Session] Save failed for ${userId}:`, e.message);
    }
}
//# sourceMappingURL=proxy-session.service.js.map
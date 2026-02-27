"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSession = loadSession;
exports.saveSession = saveSession;
const proxy_config_1 = require("./proxy-config");
async function loadSession(userId) {
    var _a;
    if (!userId || userId === 'default')
        return undefined;
    try {
        const snap = await proxy_config_1.db.collection('user_sessions').doc(userId).get();
        return snap.exists ? (_a = snap.data()) === null || _a === void 0 ? void 0 : _a.storageState : undefined;
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
        await proxy_config_1.db.collection('user_sessions').doc(userId).set({
            storageState,
            updated_at: new Date().toISOString()
        }, { merge: true });
    }
    catch (e) {
        console.error(`[Session] Save failed for ${userId}:`, e.message);
    }
}
//# sourceMappingURL=proxy-session.service.js.map
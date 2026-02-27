"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listenToRoutines = exports.syncRoutineToFirestore = void 0;
// Feature: Routines | Trace: src/utils/browser-sync-service.ts
const firebase_config_1 = require("../auth/firebase-config");
const safe_cloud_utils_1 = require("./safe-cloud.utils");
const syncRoutineToFirestore = async (routine) => {
    const ref = firebase_config_1.db.collection('routines').doc(routine.id);
    await ref.set((0, safe_cloud_utils_1.sanitizeForCloud)(Object.assign(Object.assign({}, routine), { updated_at: new Date().toISOString() })));
};
exports.syncRoutineToFirestore = syncRoutineToFirestore;
const listenToRoutines = (userId, callback) => {
    return firebase_config_1.db.collection('routines')
        .where('userId', '==', userId)
        .orderBy('updated_at', 'desc')
        .onSnapshot((snapshot) => {
        const routines = [];
        snapshot.forEach((doc) => routines.push(Object.assign(Object.assign({}, doc.data()), { id: doc.id })));
        callback(routines);
    });
};
exports.listenToRoutines = listenToRoutines;
//# sourceMappingURL=routine-sync.service.js.map
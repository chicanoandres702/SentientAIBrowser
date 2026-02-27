"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listenToRoutines = exports.syncRoutineToFirestore = void 0;
// Feature: Routines | Trace: src/utils/browser-sync-service.ts
const firestore_1 = require("firebase/firestore");
const firebase_utils_1 = require("./firebase.utils");
const safe_cloud_utils_1 = require("./safe-cloud.utils");
const syncRoutineToFirestore = async (routine) => {
    const ref = (0, firestore_1.doc)(firebase_utils_1.db, 'routines', routine.id);
    await (0, firestore_1.setDoc)(ref, (0, safe_cloud_utils_1.sanitizeForCloud)(Object.assign(Object.assign({}, routine), { updated_at: (0, firestore_1.serverTimestamp)() })));
};
exports.syncRoutineToFirestore = syncRoutineToFirestore;
const listenToRoutines = (userId, callback) => {
    const q = (0, firestore_1.query)((0, firestore_1.collection)(firebase_utils_1.db, 'routines'), (0, firestore_1.where)('userId', '==', userId), (0, firestore_1.orderBy)('updated_at', 'desc'));
    return (0, firestore_1.onSnapshot)(q, (snapshot) => {
        const routines = [];
        snapshot.forEach((doc) => routines.push(Object.assign(Object.assign({}, doc.data()), { id: doc.id })));
        callback(routines);
    });
};
exports.listenToRoutines = listenToRoutines;
//# sourceMappingURL=routine-sync.service.js.map
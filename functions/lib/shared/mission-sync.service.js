"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listenToMissions = exports.updateMissionInFirestore = exports.syncMissionToFirestore = void 0;
// Feature: Missions | Trace: src/utils/browser-sync-service.ts
const firestore_1 = require("firebase/firestore");
const firebase_utils_1 = require("./firebase.utils");
const safe_cloud_utils_1 = require("./safe-cloud.utils");
const syncMissionToFirestore = async (mission) => {
    const ref = (0, firestore_1.doc)(firebase_utils_1.db, 'missions', mission.id);
    await (0, firestore_1.setDoc)(ref, (0, safe_cloud_utils_1.sanitizeForCloud)(Object.assign(Object.assign({}, mission), { updated_at: (0, firestore_1.serverTimestamp)() })));
};
exports.syncMissionToFirestore = syncMissionToFirestore;
const updateMissionInFirestore = async (id, updates) => {
    const ref = (0, firestore_1.doc)(firebase_utils_1.db, 'missions', id);
    await (0, firestore_1.updateDoc)(ref, (0, safe_cloud_utils_1.sanitizeForCloud)(Object.assign(Object.assign({}, updates), { updated_at: (0, firestore_1.serverTimestamp)() })));
};
exports.updateMissionInFirestore = updateMissionInFirestore;
const listenToMissions = (userId, callback) => {
    const q = (0, firestore_1.query)((0, firestore_1.collection)(firebase_utils_1.db, 'missions'), (0, firestore_1.where)('userId', '==', userId), (0, firestore_1.orderBy)('timestamp', 'desc'), (0, firestore_1.limit)(20));
    return (0, firestore_1.onSnapshot)(q, (snapshot) => {
        const missions = [];
        snapshot.forEach((doc) => missions.push(Object.assign(Object.assign({}, doc.data()), { id: doc.id })));
        callback(missions);
    });
};
exports.listenToMissions = listenToMissions;
//# sourceMappingURL=mission-sync.service.js.map
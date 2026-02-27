"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listenToMissions = exports.updateMissionInFirestore = exports.syncMissionToFirestore = void 0;
// Feature: Missions | Trace: src/utils/browser-sync-service.ts
const firebase_config_1 = require("../auth/firebase-config");
const safe_cloud_utils_1 = require("./safe-cloud.utils");
const syncMissionToFirestore = async (mission) => {
    const ref = firebase_config_1.db.collection('missions').doc(mission.id);
    await ref.set((0, safe_cloud_utils_1.sanitizeForCloud)(Object.assign(Object.assign({}, mission), { updated_at: new Date().toISOString() })));
};
exports.syncMissionToFirestore = syncMissionToFirestore;
const updateMissionInFirestore = async (id, updates) => {
    const ref = firebase_config_1.db.collection('missions').doc(id);
    await ref.update((0, safe_cloud_utils_1.sanitizeForCloud)(Object.assign(Object.assign({}, updates), { updated_at: new Date().toISOString() })));
};
exports.updateMissionInFirestore = updateMissionInFirestore;
const listenToMissions = (userId, callback) => {
    return firebase_config_1.db.collection('missions')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(20)
        .onSnapshot((snapshot) => {
        const missions = [];
        snapshot.forEach((doc) => missions.push(Object.assign(Object.assign({}, doc.data()), { id: doc.id })));
        callback(missions);
    });
};
exports.listenToMissions = listenToMissions;
//# sourceMappingURL=mission-sync.service.js.map
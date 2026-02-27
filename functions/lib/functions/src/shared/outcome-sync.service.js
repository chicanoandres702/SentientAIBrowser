"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRelevantOutcomes = exports.logMissionOutcome = void 0;
// Feature: Outcomes | Trace: src/utils/browser-sync-service.ts
const firestore_1 = require("firebase/firestore");
const firebase_utils_1 = require("./firebase.utils");
const safe_cloud_utils_1 = require("./safe-cloud.utils");
const logMissionOutcome = async (outcome) => {
    const ref = (0, firestore_1.doc)(firebase_utils_1.db, 'mission_outcomes', outcome.id);
    await (0, firestore_1.setDoc)(ref, (0, safe_cloud_utils_1.sanitizeForCloud)(Object.assign(Object.assign({}, outcome), { updated_at: (0, firestore_1.serverTimestamp)() })));
};
exports.logMissionOutcome = logMissionOutcome;
const getRelevantOutcomes = async (userId, goalPattern) => {
    const q = (0, firestore_1.query)((0, firestore_1.collection)(firebase_utils_1.db, 'mission_outcomes'), (0, firestore_1.where)('userId', '==', userId), (0, firestore_1.limit)(20));
    const snap = await (0, firestore_1.getDocs)(q);
    const outcomes = [];
    snap.forEach(d => {
        const data = d.data();
        if (data.goal.toLowerCase().includes(goalPattern.toLowerCase()))
            outcomes.push(Object.assign(Object.assign({}, data), { id: d.id }));
    });
    return outcomes;
};
exports.getRelevantOutcomes = getRelevantOutcomes;
//# sourceMappingURL=outcome-sync.service.js.map
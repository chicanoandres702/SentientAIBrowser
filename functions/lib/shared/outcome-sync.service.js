"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRelevantOutcomes = exports.logMissionOutcome = void 0;
/**
 * Sentient File Header
 * Why: Mission outcome sync service for Sentient AI Browser
 * Filepath: functions/src/shared/outcome-sync.service.ts
 * Description: Records and retrieves mission outcomes from Firestore
 * Trace: Used by backend, orchestrator, and mission modules
 * Wiring: Exported functions, consumed by backend and orchestrator
 */
// Feature: Outcomes | Trace: src/utils/browser-sync-service.ts
const firebase_config_1 = require("../auth/firebase-config");
const safe_cloud_utils_1 = require("./safe-cloud.utils");
const logMissionOutcome = async (outcome) => {
    const ref = firebase_config_1.db.collection('mission_outcomes').doc(outcome.id);
    await ref.set((0, safe_cloud_utils_1.sanitizeForCloud)(Object.assign(Object.assign({}, outcome), { updated_at: new Date().toISOString() })));
};
exports.logMissionOutcome = logMissionOutcome;
const getRelevantOutcomes = async (userId, goalPattern) => {
    const snap = await firebase_config_1.db.collection('mission_outcomes')
        .where('userId', '==', userId)
        .limit(20)
        .get();
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
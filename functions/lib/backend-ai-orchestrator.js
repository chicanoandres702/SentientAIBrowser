"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Feature: AI Orchestration | Trace: scripts/orchestrator.service.js
const proxy_config_1 = require("./proxy-config");
const firestore_1 = require("firebase/firestore");
const backend_mission_executor_1 = require("./backend-mission.executor");
class BackendAIOrchestrator {
    constructor() {
        this.activeMissions = new Map();
        this.isListening = false;
    }
    start() {
        if (this.isListening)
            return;
        this.isListening = true;
        console.log('[Orchestrator] Starting Backend AI Loop...');
        (0, firestore_1.onSnapshot)((0, firestore_1.query)((0, firestore_1.collection)(proxy_config_1.db, 'missions')), (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                const missionId = change.doc.id;
                const data = change.doc.data();
                if (data.status === 'active')
                    this.startMissionLoop(missionId, data);
                else
                    this.stopMissionLoop(missionId);
            });
        });
    }
    async startMissionLoop(missionId, data) {
        if (this.activeMissions.has(missionId))
            return;
        console.log(`[Orchestrator] Launching Loop for: ${data.goal}`);
        this.activeMissions.set(missionId, setInterval(async () => {
            const res = await (0, backend_mission_executor_1.processMissionStep)(missionId);
            if (res === 'done')
                this.stopMissionLoop(missionId);
        }, 10000));
    }
    stopMissionLoop(missionId) {
        if (this.activeMissions.has(missionId)) {
            clearInterval(this.activeMissions.get(missionId));
            this.activeMissions.delete(missionId);
            console.log(`[Orchestrator] Stopped Mission: ${missionId}`);
        }
    }
}
exports.default = new BackendAIOrchestrator();
//# sourceMappingURL=backend-ai-orchestrator.js.map
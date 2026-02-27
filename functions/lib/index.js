"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onMissionTrigger = exports.sentientProxy = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const index_app_1 = require("./index-app");
Object.defineProperty(exports, "sentientProxy", { enumerable: true, get: function () { return index_app_1.sentientProxy; } });
const backend_ai_orchestrator_1 = __importDefault(require("./backend-ai-orchestrator"));
/**
 * onMissionTrigger: 2nd Gen Firestore trigger that activates the AI orchestrator
 * when a mission is created or updated to 'active'.
 */
exports.onMissionTrigger = (0, firestore_1.onDocumentWritten)({
    document: "missions/{missionId}",
    memory: "2GiB",
    timeoutSeconds: 300,
    cpu: 1,
}, async (event) => {
    var _a;
    const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.after.data();
    if (!data || data.status !== "active")
        return;
    console.log(`[Trigger] Processing active mission: ${event.params.missionId}`);
    await backend_ai_orchestrator_1.default.processMission(event.params.missionId, data);
});
//# sourceMappingURL=index.js.map
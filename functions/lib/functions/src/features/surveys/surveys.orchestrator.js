"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SurveyOrchestrator = void 0;
const surveys_utils_1 = require("./surveys.utils");
class SurveyOrchestrator {
    /**
     * Main entry point to evaluate a scanned DOM for Swagbucks surveys,
     * rank them, and return the best option to click.
     */
    static evaluateDashboard(domMap) {
        console.log("[SurveyOrchestrator] Evaluating Dashboard DOM...");
        // 1. Map raw nodes to typed SurveyData objects
        const availableSurveys = (0, surveys_utils_1.parseSurveyNodes)(domMap);
        if (availableSurveys.length === 0) {
            console.log("[SurveyOrchestrator] No valid surveys found on page.");
            return null;
        }
        // 2. Sort by highest yield (SB per minute) descending
        availableSurveys.sort((a, b) => b.yieldRatio - a.yieldRatio);
        const bestSurvey = availableSurveys[0];
        console.log(`[SurveyOrchestrator] Best Survey Found: ID ${bestSurvey.id} (${bestSurvey.rewardSB} SB / ${bestSurvey.timeMinutes} Min = ${bestSurvey.yieldRatio.toFixed(2)} Yield)`);
        return bestSurvey;
    }
}
exports.SurveyOrchestrator = SurveyOrchestrator;
//# sourceMappingURL=surveys.orchestrator.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFallbackMissionResponse = void 0;
/** Returns a safe fallback plan when the cloud LLM is unreachable */
const buildFallbackMissionResponse = () => ({
    meta: {
        reasoning: 'LLM unavailable - using fallback plan',
        intelligenceRating: 40,
        intelligenceSignals: ['Fallback mode', 'Limited context analysis'],
        memoryUsed: false,
    },
    execution: {
        plan: 'Generic mission execution plan',
        segments: [
            {
                name: 'Analyze Current Page',
                steps: [{
                        goal: 'Understand the current page and find useful targets',
                        explanation: 'Scan the DOM to understand page structure and available elements',
                        action: 'scan_dom',
                    }],
            },
            {
                name: 'Perform Requested Action',
                steps: [
                    {
                        goal: 'Perform the most relevant interaction for the mission',
                        explanation: 'Locate and interact with the most relevant elements on the page',
                        action: 'interact',
                    },
                    {
                        goal: 'Confirm the interaction succeeded',
                        explanation: 'Verify the action produced the expected result',
                        action: 'verify',
                    },
                ],
            },
            {
                name: 'Confirm Completion',
                steps: [{
                        goal: 'Finalize the mission safely',
                        explanation: 'Mark mission as successfully completed',
                        action: 'done',
                    }],
            },
        ],
    },
});
exports.buildFallbackMissionResponse = buildFallbackMissionResponse;
//# sourceMappingURL=llm-planner-fallback.js.map
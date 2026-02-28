// Feature: LLM | Why: Fallback response when LLM is unavailable — generic scan+interact+done plan
import { MissionResponse } from './llm-mission-planner';

/** Returns a safe fallback plan when the cloud LLM is unreachable */
export const buildFallbackMissionResponse = (): MissionResponse => ({
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
                    explanation: 'Scan the DOM to understand page structure and available elements',
                    action: 'scan_dom',
                }],
            },
            {
                name: 'Perform Requested Action',
                steps: [
                    { explanation: 'Locate and interact with the most relevant elements on the page', action: 'interact' },
                    { explanation: 'Verify the action produced the expected result', action: 'verify' },
                ],
            },
            {
                name: 'Confirm Completion',
                steps: [{
                    explanation: 'Mark mission as successfully completed',
                    action: 'done',
                }],
            },
        ],
    },
});

/**
 * Sentient File Header
 * Why: Local fallback prompt planner for Sentient AI Browser
 * Filepath: src/utils/prompt-planner.ts
 * Description: Decomposes user prompts into actionable mission segments and steps
 * Trace: Used by workflow, orchestrator, and mission planner modules
 * Wiring: Exported planner function, consumed by workflow and orchestrator
 */
// Feature: Prompt Planner | Trace: src/utils/prompt-planner.ts
// ===============================
// File: src/utils/prompt-planner.ts
// Purpose: Local fallback planner logic with debug logging
// Date: 2026-03-04
// ===============================
const DEBUG = true;
function debugLog(...args: any[]) { if (DEBUG) console.log('[DEBUG prompt-planner]', ...args); }
// Feature: Tasks | Why: Local fallback planner — decomposes user prompts into actionable task segments
// Pattern matchers are in prompt-pattern-matchers.ts to keep this file focused on orchestration
import {
    matchSurveyPattern,
    matchSwagbucksPattern,
    matchScholarshipPattern,
    matchClickPattern,
    matchTypePattern,
    genericFallbackSegments,
} from './prompt-pattern-matchers';

export interface TaskStep {
    explanation: string;
    action: string;
}

export interface MissionSegment {
    name: string;
    steps: TaskStep[];
}

export interface MissionPlan {
    title: string;
    segments: MissionSegment[];
}

/**
 * Local fallback planner — produces named segments (actionable task titles)
 * with steps as sub-actions underneath. Tries each pattern matcher in order.
 */
export const planPromptLocally = (prompt: string): MissionPlan => {
    const lowerPrompt = prompt.toLowerCase();
     debugLog('Planning prompt:', prompt);

    // Try each domain-specific pattern matcher in priority order
    let segments: MissionSegment[] = [];
    segments = matchSurveyPattern(lowerPrompt);
    if (segments.length === 0) segments = matchSwagbucksPattern(lowerPrompt);
    if (segments.length === 0) segments = matchScholarshipPattern(lowerPrompt);
    if (segments.length === 0) segments = matchClickPattern(prompt, lowerPrompt);
    if (segments.length === 0) segments = matchTypePattern(lowerPrompt);
    if (segments.length === 0) segments = genericFallbackSegments();
    debugLog('Matched segments:', JSON.stringify(segments, null, 2));

    return {
        title: prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''),
        segments: segments.slice(0, 6),
    };
};

export const generateMockPlanResponse = (prompt: string) => {
    const plan = planPromptLocally(prompt);
     debugLog('Mock plan response:', JSON.stringify(plan, null, 2));
    return {
        missionResponse: {
            execution: { segments: plan.segments },
        },
    };
};

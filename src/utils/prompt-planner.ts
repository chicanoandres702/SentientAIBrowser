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

    // Try each domain-specific pattern matcher in priority order
    const segments =
        matchSurveyPattern(lowerPrompt) ||
        matchSwagbucksPattern(lowerPrompt) ||
        matchScholarshipPattern(lowerPrompt) ||
        matchClickPattern(prompt, lowerPrompt) ||
        matchTypePattern(lowerPrompt) ||
        [];

    // Use generic fallback if nothing matched (all matchers returned [])
    const finalSegments = segments.length > 0 ? segments : genericFallbackSegments();

    return {
        title: prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''),
        segments: finalSegments.slice(0, 6),
    };
};

export const generateMockPlanResponse = (prompt: string) => {
    const plan = planPromptLocally(prompt);
    return {
        missionResponse: {
            execution: { segments: plan.segments },
        },
    };
};

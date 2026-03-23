// Feature: Planning | Trace: README.md
/*
 * [Parent Feature/Milestone] Planning
 * [Child Task/Issue] Local fallback prompt planner
 * [Subtask] Decompose user prompts into actionable mission segments
 * [Upstream] User prompt -> [Downstream] Mission plan with task steps
 * [Law Check] 52 lines | Passed 100-Line Law
 */

import {
  matchSurveyPattern,
  matchSwagbucksPattern,
  matchScholarshipPattern,
  matchClickPattern,
  matchTypePattern,
  MissionSegment,
} from './planning.pattern-matchers.service';
import { genericFallbackSegments } from './planning.pattern-matchers.types';

export interface TaskStep {
  explanation: string;
  action: string;
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

  const segments =
    matchSurveyPattern(lowerPrompt) ||
    matchSwagbucksPattern(lowerPrompt) ||
    matchScholarshipPattern(lowerPrompt) ||
    matchClickPattern(prompt, lowerPrompt) ||
    matchTypePattern(lowerPrompt) ||
    [];

  const finalSegments = segments.length > 0 ? segments : genericFallbackSegments();

  return {
    title: prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''),
    segments: finalSegments.slice(0, 6),
  };
};

export const generateMockPlanResponse = (prompt: string) => {
  const plan = planPromptLocally(prompt);
  return {
    missionResponse: { execution: { segments: plan.segments } },
  };
};

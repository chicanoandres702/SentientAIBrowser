// Feature: Prompt Planner Logic Test | Trace: tests/prompt-planner.logic.test.ts
// ===============================
// File: tests/prompt-planner.logic.test.ts
// Purpose: Unit tests for planPromptLocally with debug logging
// Date: 2026-03-04
// ===============================
const DEBUG = true;
function debugLog(...args: any[]) { if (DEBUG) console.log('[DEBUG prompt-planner.test]', ...args); }
// Feature: Planner Logic | Trace: src/utils/prompt-planner.ts
import { planPromptLocally } from '../src/utils/prompt-planner';

describe('planPromptLocally', () => {
  it('should return a MissionPlan with segments for a survey prompt', () => {
    const result = planPromptLocally('Complete the survey about browser usage');
    debugLog('Survey prompt result:', JSON.stringify(result, null, 2));
    expect(result).toBeDefined();
    expect(result.segments.length).toBeGreaterThan(0);
    expect(result.segments[0].steps.length).toBeGreaterThan(0);
  });

  it('should return a MissionPlan with segments for a click prompt', () => {
    const result = planPromptLocally('Click the submit button');
    debugLog('Click prompt result:', JSON.stringify(result, null, 2));
    expect(result).toBeDefined();
    expect(result.segments.length).toBeGreaterThan(0);
    expect(result.segments[0].steps.some(step => step.action === 'click')).toBe(true);
  });

  it('should return a MissionPlan with segments for a type prompt', () => {
    const result = planPromptLocally('Type your email address');
    debugLog('Type prompt result:', JSON.stringify(result, null, 2));
    expect(result).toBeDefined();
    expect(result.segments.length).toBeGreaterThan(0);
    expect(result.segments[0].steps.some(step => step.action === 'type')).toBe(true);
  });
});

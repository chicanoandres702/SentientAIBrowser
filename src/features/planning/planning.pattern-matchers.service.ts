// Feature: Planning | Trace: README.md
/*
 * [Parent Feature/Milestone] Planning
 * [Child Task/Issue] Domain-specific pattern matchers
 * [Subtask] Keyword-based pattern detection for mission segments
 * [Upstream] User prompt -> [Downstream] Domain-specific mission segments
 * [Law Check] 90 lines | Passed 100-Line Law
 */

import { MissionSegment, extractClickTarget } from './planning.pattern-matchers.types';

export * from './planning.pattern-matchers.types';

export const matchSurveyPattern = (lowerPrompt: string): MissionSegment[] => {
  if (!lowerPrompt.includes('survey') && !lowerPrompt.includes('form')) return [];
  return [
    {
      name: 'Read Survey Instructions',
      steps: [{ explanation: 'Scan page for survey instructions', action: 'scan_dom' }],
    },
    {
      name: 'Complete Survey Questions',
      steps: [
        { explanation: 'Locate form fields', action: 'scan_dom' },
        { explanation: 'Answer questions', action: 'interact_form' },
      ],
    },
    {
      name: 'Submit Response',
      steps: [
        { explanation: 'Click submit button', action: 'click_submit' },
        { explanation: 'Wait for confirmation', action: 'wait_confirmation' },
      ],
    },
  ];
};

export const matchSwagbucksPattern = (lowerPrompt: string): MissionSegment[] => {
  if (!lowerPrompt.includes('swagbucks') && !lowerPrompt.includes('swag bucks'))
    return [];
  return [
    { name: 'Open Task List', steps: [{ explanation: 'Navigate to task listing', action: 'navigate' }] },
    { name: 'Select Task', steps: [{ explanation: 'Click available task', action: 'click_task' }] },
    { name: 'Complete Task', steps: [{ explanation: 'Interact to complete', action: 'interact' }] },
    {
      name: 'Claim Reward',
      steps: [
        { explanation: 'Click claim button', action: 'click_claim' },
        { explanation: 'Verify points added', action: 'verify_balance' },
      ],
    },
  ];
};

export const matchScholarshipPattern = (lowerPrompt: string): MissionSegment[] => {
  if (
    !lowerPrompt.includes('scholarship') &&
    !lowerPrompt.includes('essay') &&
    !lowerPrompt.includes('application')
  )
    return [];
  return [
    { name: 'Review Requirements', steps: [{ explanation: 'Read application criteria', action: 'scan_dom' }] },
    { name: 'Fill Personal Info', steps: [{ explanation: 'Enter personal details', action: 'interact_form' }] },
    { name: 'Write Essay', steps: [{ explanation: 'Compose essay response', action: 'compose_text' }] },
    {
      name: 'Upload & Submit',
      steps: [
        { explanation: 'Attach documents', action: 'upload_files' },
        { explanation: 'Submit application', action: 'click_submit' },
      ],
    },
  ];
};

export const matchClickPattern = (prompt: string, lowerPrompt: string): MissionSegment[] => {
  if (!lowerPrompt.includes('click') && !lowerPrompt.includes('navigate')) return [];
  const target = extractClickTarget(prompt);
  if (!target) return [];
  return [
    {
      name: `Go to ${target}`,
      steps: [
        { explanation: `Find element: ${target}`, action: 'find_element' },
        { explanation: `Click on ${target}`, action: 'click' },
        { explanation: 'Wait for navigation', action: 'wait_load' },
      ],
    },
  ];
};

export const matchTypePattern = (lowerPrompt: string): MissionSegment[] => {
  if (!lowerPrompt.includes('enter') && !lowerPrompt.includes('type')) return [];
  return [
    {
      name: 'Enter Information',
      steps: [
        { explanation: 'Focus on input field', action: 'focus' },
        { explanation: 'Type information', action: 'type' },
        { explanation: 'Submit data', action: 'submit' },
      ],
    },
  ];
};


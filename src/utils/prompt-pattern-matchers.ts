// Feature: Tasks | Why: Keyword-based pattern matchers for local fallback mission decomposition
// Each function detects a specific domain and returns segments for that pattern

import { MissionSegment } from './prompt-planner';

/** Survey/form patterns — detect by keywords like "survey", "form" */
export const matchSurveyPattern = (lowerPrompt: string): MissionSegment[] => {
    if (!lowerPrompt.includes('survey') && !lowerPrompt.includes('form')) return [];
    return [
        { name: 'Read Survey Instructions', steps: [{ explanation: 'Scan page to find survey instructions and requirements', action: 'scan_dom' }] },
        { name: 'Complete Survey Questions', steps: [{ explanation: 'Locate form fields and answer options', action: 'scan_dom' }, { explanation: 'Fill in each survey question', action: 'interact_form' }] },
        { name: 'Submit Survey Response', steps: [{ explanation: 'Click the submit button', action: 'click_submit' }, { explanation: 'Wait for confirmation page', action: 'wait_confirmation' }] },
    ];
};

/** Swagbucks task patterns */
export const matchSwagbucksPattern = (lowerPrompt: string): MissionSegment[] => {
    if (!lowerPrompt.includes('swagbucks') && !lowerPrompt.includes('swag bucks')) return [];
    return [
        { name: 'Open Task List', steps: [{ explanation: 'Navigate to the Swagbucks task listing page', action: 'navigate' }] },
        { name: 'Select Available Task', steps: [{ explanation: 'Click on a task that is available to complete', action: 'click_task' }] },
        { name: 'Complete Task Requirements', steps: [{ explanation: 'Interact with elements to fulfill task requirements', action: 'interact' }] },
        { name: 'Claim Reward Points', steps: [{ explanation: 'Click the claim/redeem button', action: 'click_claim' }, { explanation: 'Verify points were added to account balance', action: 'verify_balance' }] },
    ];
};

/** Academic/scholarship patterns */
export const matchScholarshipPattern = (lowerPrompt: string): MissionSegment[] => {
    if (!lowerPrompt.includes('scholarship') && !lowerPrompt.includes('essay') && !lowerPrompt.includes('application')) return [];
    return [
        { name: 'Review Application Requirements', steps: [{ explanation: 'Read through application criteria and required fields', action: 'scan_dom' }] },
        { name: 'Fill Out Personal Information', steps: [{ explanation: 'Enter name, email, and personal details into form fields', action: 'interact_form' }] },
        { name: 'Write Essay Response', steps: [{ explanation: 'Compose and enter essay text in the response field', action: 'compose_text' }] },
        { name: 'Upload Documents & Submit', steps: [{ explanation: 'Attach supporting documents', action: 'upload_files' }, { explanation: 'Click the submit button', action: 'click_submit' }] },
    ];
};

/** Click/navigation patterns */
export const matchClickPattern = (prompt: string, lowerPrompt: string): MissionSegment[] => {
    if (!lowerPrompt.includes('click') && !lowerPrompt.includes('navigate')) return [];
    const targetMatch = prompt.match(/(?:click|navigate to)\s+(?:on\s+)?["']?([^"']+)["']?/i);
    if (!targetMatch) return [];
    return [{ name: `Go to ${targetMatch[1]}`, steps: [
        { explanation: `Find the element: ${targetMatch[1]}`, action: 'find_element' },
        { explanation: `Click on ${targetMatch[1]}`, action: 'click' },
        { explanation: 'Wait for page navigation to complete', action: 'wait_load' },
    ] }];
};

/** Input/type patterns */
export const matchTypePattern = (lowerPrompt: string): MissionSegment[] => {
    if (!lowerPrompt.includes('enter') && !lowerPrompt.includes('type')) return [];
    return [{ name: 'Enter Information', steps: [
        { explanation: 'Focus on the target input field', action: 'focus' },
        { explanation: 'Type the requested information', action: 'type' },
        { explanation: 'Submit the entered data', action: 'submit' },
    ] }];
};

/** Generic fallback when no pattern matches */
export const genericFallbackSegments = (): MissionSegment[] => [
    { name: 'Analyze Current Page', steps: [
        { explanation: 'Scan the DOM for interactive elements and page structure', action: 'scan_dom' },
        { explanation: 'Identify relevant buttons, links, and forms', action: 'find_interactive' },
    ] },
    { name: 'Perform Requested Action', steps: [{ explanation: 'Interact with the most relevant element on the page', action: 'interact' }] },
    { name: 'Verify Completion', steps: [{ explanation: 'Check that the action produced the expected result', action: 'verify_result' }] },
];

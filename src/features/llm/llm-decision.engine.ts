/**
 * This service manages the connection to the LLM (Large Language Model) API.
 * It sends the condensed DOM map and the user's instructions to determine
 * which element the AI Browser should interact with next.
 */

import { buildGeminiPromptWithMemoryContext } from './llm-context.builder';
import { ai } from '../auth/firebase-config';
import { getGenerativeModel } from 'firebase/ai';

// No hardcoded keys. Firebase AI Logic handles authentication and quota via the project backend.

export interface LLMAction {
  action: 'click' | 'type' | 'wait' | 'done' | 'wait_for_user' | 'ask_user' | 'record_knowledge' | 'lookup_documentation' | 'create_github_issue';
  targetId?: string;
  value?: string;
  reasoning: string;
  question?: string; // The message to show the user if action is 'ask_user'
  requestType?: 'confirm' | 'input'; // confirm = Yes/No, input = text prompt
  intelligenceRating?: number; // 0-100 score of memory integration
  memoryUsed?: boolean;
}

export const determineNextAction = async (
  prompt: string,
  domMap: any[],
  screenshotBase64?: string,
  domain?: string,
  lookedUpDocs: any[] = [],
  isScholarMode: boolean = false
): Promise<LLMAction | null> => {
  console.log('Sending DOM map to LLM. Domain:', domain, 'Scholar Mode:', isScholarMode, 'Node Count:', domMap.length);

  // Construct the strictly formatted prompt for the LLM
  const systemInstruction = `You are an advanced autonomous AI web browser agent.
Your objective is to help the user complete tasks on the web efficiently and safely.

### OPERATIONAL GUIDELINES (NEURAL ARCHETYPES):
1. **MISSION: MEDIC (RECURSIVE DEBUGGING)**: Before taking an action, identify the design intent of the page. If an action fails, perform a Root Cause Analysis (RCA). Identify *why* it failed (e.g., "The button is covered by a modal") before trying again.
2. **DIAGNOSTIC LISTENER**: Monitor the "Action Log". If the browser returns an ERROR message, prioritize diagnosing the error over the original goal.
3. **ANTI-DRIFT**: Maintain strict focus on the User Objective. If the page tries to divert you (ads, popups, unrelated links), ignore them unless they block the goal.
4. **AUTHENTICATION DETECTION**: If the page is a login screen, registration form, or requires MFA/Captcha, you MUST return action "wait_for_user" with a clear explanation.
5. **MEMORY ARCHETYPE**: You have access to "HISTORICAL MEMORY" in the User Objective. These are answers that successfully avoided disqualification in the past. If the current page asks a question that matches a memory entry, you MUST give the same answer to ensure consistency and avoid disqualification.
6. **INTERACTIVE PRIORITIZATION**: Prioritize <button>, <a>, and <input>. Look for critical verbs: "Submit", "Log In", "Continue", "Next".
7. **SELECTIVE INTERACTION**: Minimize clicks. Do not interact with elements irrelevant to the goal.
8. **GOAL COMPLETION**: Return action "done" only when the final destination is reached or the final task is performed.
9. **INTERACTIVE PERMISSION**: If you encounter a state where multiple valid paths exist, or if an action has significant consequences (e.g. deleting an account, making a purchase), or if you need specific missing information from the user, use action "ask_user".
10. **MISSION: SCHOLAR (ACADEMIC DOMAIN)**:
    - If the domain is academic (e.g., capella.edu), you MUST read all instructions, reading lists, and rubrics before completing an assignment.
    - Click all links in the instructional area to gather full context.
    - Maintain formal academic etiquette and prioritize assignments with upcoming deadlines.
    - If Microsoft Word Online is used and you encounter issues, suggest looking up documentation for integration.
11. **KNOWLEDGE PERSISTENCE**: If you find critical data (Reading Lists, Quiz Instructions, Course Rubrics, Etiquette rules), use action "record_knowledge" with the data in the "value" field. This data will be available to you in future sessions on this domain.
12. **AUTONOMOUS BUG TRACKING**: If you identify a persistent technical issue, a broken selector, or a bug in the browser's own logic that prevents progress across multiple retries, use action "create_github_issue" with a detailed title and body in the "value" field.

### RESPONSE FORMAT:
You must respond ONLY with a single JSON object.

{
  "reasoning": "A step-by-step logical breakdown following the Medic/Diagnostic/Memory archetypes.",
  "action": "click | type | wait | wait_for_user | ask_user | record_knowledge | lookup_documentation | create_github_issue | done",
  "targetId": "The string ID of the element to interact with (optional)",
  "value": "The text to type OR the knowledge to record (required for 'type' or 'record_knowledge')",
  "question": "The question/prompt for the user (required if action is 'ask_user')",
  "requestType": "confirm | input (required if action is 'ask_user')"
}

NOTE: You have been provided with both a DOM Map (logic) and a Screenshot (visual). Use the screenshot to identify elements that might be missing or overlaying in the DOM (e.g. popups, ads, captchas).`;

  const resolvedPrompt = await buildGeminiPromptWithMemoryContext(prompt, domain, lookedUpDocs, isScholarMode);
  const userPayload = `
User Objective: ${resolvedPrompt}
Current Domain: ${domain || 'General Navigation'}

DOM Map:
${JSON.stringify(domMap, null, 2)}
`;

  try {
    const model = getGenerativeModel(ai, { model: 'gemini-2.5-flash' });

    const parts: any[] = [{ text: systemInstruction + '\n\n' + userPayload }];

    if (screenshotBase64) {
      const base64Data = screenshotBase64.split(',')[1] || screenshotBase64;
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: 'image/png'
        }
      });
    }

    // To generate text output, call generateContent with the system + user instruction
    const result = await model.generateContent(parts);
    const llmResponseText = result.response.text();

    if (!llmResponseText) {
      console.error('Empty response from GenAI');
      return null;
    }

    // Clean up potential markdown formatting (sometimes AI wraps JSON in ```json blocks)
    const cleanedText = llmResponseText.replace(/```json|```/g, '').trim();

    // Parse the strictly requested JSON
    const parsedAction: LLMAction = JSON.parse(cleanedText);

    // Heuristic: If reasoning mentions memory or historical context, flag memoryUsed
    parsedAction.memoryUsed = cleanedText.toLowerCase().includes('memory') ||
      cleanedText.toLowerCase().includes('historical');
    parsedAction.intelligenceRating = parsedAction.memoryUsed ? 85 : 45; // Base AI intelligence vs learning loop intelligence

    console.log('LLM Decision Received:', parsedAction);

    return parsedAction;

  } catch (error) {
    console.error('Failed to communicate with LLM:', error);
    return null;
  }
};

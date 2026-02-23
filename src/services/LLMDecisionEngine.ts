/**
 * This service manages the connection to the LLM (Large Language Model) API.
 * It sends the condensed DOM map and the user's instructions to determine
 * which element the AI Browser should interact with next.
 */

import { buildGeminiPromptWithMemoryContext } from './LLMContextBuilder';

// WARNING: Never hardcode production API keys in source code.
// For testing purposes, we'll assume an environment variable or secure config later.
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'YOUR_API_KEY_HERE';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export interface LLMAction {
  action: 'click' | 'type' | 'wait' | 'done';
  targetId?: string;
  value?: string;
  reasoning: string;
}

export const determineNextAction = async (prompt: string, domMap: any[]): Promise<LLMAction | null> => {
  console.log('Sending DOM map to LLM. Node Count:', domMap.length);

  // Construct the strictly formatted prompt for the LLM
  const systemInstruction = `You are an autonomous web browser agent. 
You will be given a user's objective and a JSON map of the current webpage DOM.
Your job is to decide the VERY NEXT ACTION required to accomplish the objective.
You must respond with valid JSON ONLY. No markdown, no explanations outside the JSON.

Expected JSON format:
{
  "reasoning": "A brief explanation of why you chose this action based on the step-by-step logic.",
  "action": "click | type | wait | done",
  "targetId": "The string ID of the element to interact with (optional if waiting or done)",
  "value": "The text to type if action is 'type' (optional)"
}`;

  const resolvedPrompt = await buildGeminiPromptWithMemoryContext(prompt);
  const userPayload = `
User Objective: ${resolvedPrompt}

DOM Map:
${JSON.stringify(domMap, null, 2)}
`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: systemInstruction + '\n\n' + userPayload }]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json', // Force Gemini to return strictly JSON
          temperature: 0.1, // Low temperature for deterministic, logical navigation
        }
      })
    });

    if (!response.ok) {
      console.error('LLM API Error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    const llmResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!llmResponseText) {
      console.error('Invalid response structure from LLM payload:', data);
      return null;
    }

    // Parse the strictly requested JSON
    const parsedAction: LLMAction = JSON.parse(llmResponseText);
    console.log('LLM Decision Received:', parsedAction);

    return parsedAction;

  } catch (error) {
    console.error('Failed to communicate with LLM:', error);
    return null;
  }
};

// Feature: LLM | Why: Sends DOM map + prompt to Gemini and returns the next atomic action chain (client-side)
import { buildGeminiPromptWithMemoryContext } from './llm-context.builder';
import { auth } from '../auth/firebase-config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getLessonsLearned } from './llm-memory-service';
import { getRelevantContext, KnowledgeContext } from './knowledge-hierarchy.service';
import { DECISION_SYSTEM_INSTRUCTION } from './llm-decision-prompt.shared';

export { MISSION_RESPONSE_SCHEMA } from './llm-decision-schema';

export interface MissionStep {
  action: 'click' | 'type' | 'wait' | 'done' | 'wait_for_user' | 'ask_user' | 'record_knowledge' | 'lookup_documentation';
  targetId?: string;
  value?: string;
  domContext?: { tagName?: string; text?: string; role?: string; placeholder?: string };
  knowledgeContext?: { groupId?: string; contextId?: string; unitId?: string };
  explanation: string;
}

export interface MissionResponse {
  meta: { reasoning: string; intelligenceRating: number; intelligenceSignals?: string[]; memoryUsed: boolean };
  execution: { plan: string; segments: Array<{ name: string; steps: MissionStep[] }> };
}

export const determineNextAction = async (
  prompt: string, domMap: any[], screenshotBase64?: string,
  domain?: string, lookedUpDocs: any[] = [], isScholarMode: boolean = false, context?: KnowledgeContext, runtimeGeminiApiKey?: string,
): Promise<MissionResponse | null> => {
  if (!runtimeGeminiApiKey) {
    console.error('[LLM] Runtime Gemini API key required. Set key in Settings > LLM OVERRIDE.');
    return null;
  }

  console.log('Sending DOM map to LLM. Domain:', domain, 'Scholar:', isScholarMode, 'Nodes:', domMap.length);

  const lessons = await getLessonsLearned(auth.currentUser?.uid || 'anonymous', prompt);
  const relevantContext = context ? await getRelevantContext(auth.currentUser?.uid || 'anonymous', context) : '';
  const resolvedPrompt = await buildGeminiPromptWithMemoryContext(prompt, domain, lookedUpDocs, isScholarMode);

  const userPayload = `
User Objective: ${resolvedPrompt}
Current Domain: ${domain || 'General Navigation'}
${lessons}
${relevantContext}
DOM Map:
${JSON.stringify(domMap, null, 2)}
`;

  try {
    const genAI = new GoogleGenerativeAI(runtimeGeminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const parts: any[] = [{ text: DECISION_SYSTEM_INSTRUCTION + '\n\n' + userPayload }];

    if (screenshotBase64) {
      const base64Data = screenshotBase64.split(',')[1] || screenshotBase64;
      parts.push({ inlineData: { data: base64Data, mimeType: 'image/png' } });
    }

    const result = await model.generateContent(parts);
    const llmResponseText = result.response.text();
    if (!llmResponseText) return null;

    const cleanedText = llmResponseText.replace(/```json|```/g, '').trim();
    const parsed: MissionResponse = JSON.parse(cleanedText);

    parsed.meta.memoryUsed = cleanedText.toLowerCase().includes('memory') || cleanedText.toLowerCase().includes('historical');
    parsed.meta.intelligenceRating = parsed.meta.memoryUsed ? 95 : 65;

    console.log('Atomic Chain Received:', parsed.execution.plan);
    return parsed;
  } catch (error) {
    console.error('Failed to communicate with LLM:', error);
    return null;
  }
};

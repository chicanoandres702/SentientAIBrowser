// Feature: LLM | Why: Sends ARIA snapshot + prompt to Gemini and returns the next atomic action chain
import { buildGeminiPromptWithMemoryContext } from './llm-context.builder';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getLessonsLearned } from './llm-memory-service';
import { getRelevantContext, KnowledgeContext } from './knowledge-hierarchy.service';
import { DECISION_SYSTEM_INSTRUCTION } from './llm-decision-prompt';

export interface MissionStep {
  action: 'click' | 'type' | 'navigate' | 'wait' | 'done' | 'wait_for_user' | 'ask_user' | 'record_knowledge' | 'lookup_documentation' | 'upload_file';
  goal?: string;
  // ARIA selectors (Playwright MCP approach — stable across DOM changes)
  role?: string;    // ARIA role: 'button' | 'link' | 'textbox' | 'checkbox' | 'combobox'
  name?: string;    // Accessible name as shown in ARIA snapshot
  text?: string;    // Visible text fallback
  url?: string;     // For 'navigate' action
  // Legacy DOM-map selector (HeadlessWebView fallback path only)
  targetId?: string;
  domContext?: { tagName?: string; text?: string; role?: string; placeholder?: string };
  knowledgeContext?: { groupId?: string; contextId?: string; unitId?: string };
  value?: string;
  explanation: string;
}

export interface MissionResponse {
  meta: { reasoning: string; intelligenceRating: number; intelligenceSignals?: string[]; memoryUsed: boolean };
  execution: { plan: string; segments: Array<{ name: string; steps: MissionStep[] }> };
}

export const determineNextAction = async (
  userId: string, prompt: string, domMap: any[], screenshotBase64?: string,
  domain?: string, lookedUpDocs: any[] = [], isScholarMode: boolean = false, context?: KnowledgeContext,
  ariaSnapshot?: string,
  apiKeyOverride?: string,
): Promise<MissionResponse | null> => {
  console.log('Sending page state to LLM. Domain:', domain, 'Scholar:', isScholarMode, 'ARIA:', !!ariaSnapshot, 'DOM:', domMap.length);

  const lessons = await getLessonsLearned(userId || 'anonymous', prompt);
  const relevantContext = context ? await getRelevantContext(userId || 'anonymous', context) : '';
  const resolvedPrompt = await buildGeminiPromptWithMemoryContext(prompt, domain, lookedUpDocs, isScholarMode);

  // Why: ARIA snapshot (Playwright MCP format) is preferred — stable role+name refs that
  // survive DOM mutations. DOM map is fallback for HeadlessWebView-only sessions.
  const pageContext = ariaSnapshot
    ? `ARIA Snapshot (use role+name to identify elements):\n${ariaSnapshot}`
    : `DOM Map:\n${JSON.stringify(domMap, null, 2)}`;

  const userPayload = `
User Objective: ${resolvedPrompt}
Current Domain: ${domain || 'General Navigation'}
${lessons}
${relevantContext}
${pageContext}
`;

  try {
    // Why: Cloud Run may provide either GOOGLE_API_KEY (server-side) or EXPO_PUBLIC_GEMINI_API_KEY.
    // Prefer server key, then fall back for backwards compatibility.
    const geminiKey = apiKeyOverride || process.env.GOOGLE_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
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

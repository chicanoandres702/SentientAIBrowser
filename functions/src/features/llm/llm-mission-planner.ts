// Feature: LLM Mission Planner | Why: Decomposes user prompts into actionable mission tasks via Gemini
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildMissionPlannerPrompt } from './llm-planner-prompt';
import { buildFallbackMissionResponse } from './llm-planner-fallback';

// Why: support both server and legacy env names so planner keeps working across deploy scripts.
const geminiKey = process.env.GOOGLE_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(geminiKey);

export interface MissionStep {
    action: 'click' | 'type' | 'wait' | 'done' | 'wait_for_user' | 'ask_user' | 'record_knowledge' | 'lookup_documentation' | 'scan_dom' | 'navigate' | 'verify' | 'interact' | 'extract_data';
    goal?: string;
    targetId?: string;
    value?: string;
    domContext?: { tagName?: string; text?: string; role?: string; placeholder?: string };
    knowledgeContext?: { groupId?: string; contextId?: string; unitId?: string };
    explanation: string;
}

export interface MissionSegment { name: string; steps: MissionStep[] }
export interface MissionMeta { reasoning: string; intelligenceRating: number; intelligenceSignals?: string[]; memoryUsed: boolean }
export interface MissionExecution { plan: string; segments: MissionSegment[] }
export interface MissionResponse { meta: MissionMeta; execution: MissionExecution }

export const planMissionWithLLM = async (prompt: string, schemaPrompt?: string): Promise<MissionResponse> => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const systemPrompt = buildMissionPlannerPrompt(schemaPrompt);

        const response = await model.generateContent({
            contents: [{
                role: 'user',
                parts: [{ text: `Plan this mission into detailed executable tasks: "${prompt}"\n\nIMPORTANT: Use the application schemas provided in the system instruction to reference the correct data structures, Firestore collections, and allowed actions when planning steps.` }],
            }],
            systemInstruction: systemPrompt,
        });

        const responseText = response.response.text();
        const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const missionResponse: MissionResponse = JSON.parse(cleanedText);

        if (!missionResponse.meta) missionResponse.meta = { reasoning: '', intelligenceRating: 70, memoryUsed: false };
        if (!missionResponse.execution) missionResponse.execution = { plan: '', segments: [] };

        return missionResponse;
    } catch (error) {
        console.error('LLM Mission Planning failed:', error);
        return buildFallbackMissionResponse();
    }
};

export const generateLLMPlanResponse = async (prompt: string, schemaPrompt?: string): Promise<{ missionResponse: MissionResponse }> => {
    const missionResponse = await planMissionWithLLM(prompt, schemaPrompt);
    return { missionResponse };
};

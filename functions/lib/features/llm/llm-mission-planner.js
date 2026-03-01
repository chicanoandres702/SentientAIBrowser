"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateLLMPlanResponse = exports.planMissionWithLLM = void 0;
// Feature: LLM Mission Planner | Why: Decomposes user prompts into actionable mission tasks via Gemini
const generative_ai_1 = require("@google/generative-ai");
const llm_planner_prompt_1 = require("./llm-planner-prompt");
const llm_planner_fallback_1 = require("./llm-planner-fallback");
// Why: support both server and legacy env names so planner keeps working across deploy scripts.
const geminiKey = process.env.GOOGLE_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const genAI = new generative_ai_1.GoogleGenerativeAI(geminiKey);
const planMissionWithLLM = async (prompt, schemaPrompt) => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const systemPrompt = (0, llm_planner_prompt_1.buildMissionPlannerPrompt)(schemaPrompt);
        const response = await model.generateContent({
            contents: [{
                    role: 'user',
                    parts: [{ text: `Plan this mission into detailed executable tasks: "${prompt}"\n\nIMPORTANT: Use the application schemas provided in the system instruction to reference the correct data structures, Firestore collections, and allowed actions when planning steps.` }],
                }],
            systemInstruction: systemPrompt,
        });
        const responseText = response.response.text();
        const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const missionResponse = JSON.parse(cleanedText);
        if (!missionResponse.meta)
            missionResponse.meta = { reasoning: '', intelligenceRating: 70, memoryUsed: false };
        if (!missionResponse.execution)
            missionResponse.execution = { plan: '', segments: [] };
        return missionResponse;
    }
    catch (error) {
        console.error('LLM Mission Planning failed:', error);
        return (0, llm_planner_fallback_1.buildFallbackMissionResponse)();
    }
};
exports.planMissionWithLLM = planMissionWithLLM;
const generateLLMPlanResponse = async (prompt, schemaPrompt) => {
    const missionResponse = await (0, exports.planMissionWithLLM)(prompt, schemaPrompt);
    return { missionResponse };
};
exports.generateLLMPlanResponse = generateLLMPlanResponse;
//# sourceMappingURL=llm-mission-planner.js.map
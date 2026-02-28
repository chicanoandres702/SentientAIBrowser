"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.determineNextAction = void 0;
// Feature: LLM | Why: Sends DOM map + prompt to Gemini and returns the next atomic action chain
const llm_context_builder_1 = require("./llm-context.builder");
const generative_ai_1 = require("@google/generative-ai");
const llm_memory_service_1 = require("./llm-memory-service");
const knowledge_hierarchy_service_1 = require("./knowledge-hierarchy.service");
const llm_decision_prompt_1 = require("./llm-decision-prompt");
const determineNextAction = async (userId, prompt, domMap, screenshotBase64, domain, lookedUpDocs = [], isScholarMode = false, context) => {
    console.log('Sending DOM map to LLM. Domain:', domain, 'Scholar Mode:', isScholarMode, 'Node Count:', domMap.length);
    const lessons = await (0, llm_memory_service_1.getLessonsLearned)(userId || 'anonymous', prompt);
    const relevantContext = context ? await (0, knowledge_hierarchy_service_1.getRelevantContext)(userId || 'anonymous', context) : '';
    const resolvedPrompt = await (0, llm_context_builder_1.buildGeminiPromptWithMemoryContext)(prompt, domain, lookedUpDocs, isScholarMode);
    const userPayload = `
User Objective: ${resolvedPrompt}
Current Domain: ${domain || 'General Navigation'}
${lessons}
${relevantContext}
DOM Map:
${JSON.stringify(domMap, null, 2)}
`;
    try {
        const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY || '');
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const parts = [{ text: llm_decision_prompt_1.DECISION_SYSTEM_INSTRUCTION + '\n\n' + userPayload }];
        if (screenshotBase64) {
            const base64Data = screenshotBase64.split(',')[1] || screenshotBase64;
            parts.push({ inlineData: { data: base64Data, mimeType: 'image/png' } });
        }
        const result = await model.generateContent(parts);
        const llmResponseText = result.response.text();
        if (!llmResponseText)
            return null;
        const cleanedText = llmResponseText.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleanedText);
        parsed.meta.memoryUsed = cleanedText.toLowerCase().includes('memory') || cleanedText.toLowerCase().includes('historical');
        parsed.meta.intelligenceRating = parsed.meta.memoryUsed ? 95 : 65;
        console.log('Atomic Chain Received:', parsed.execution.plan);
        return parsed;
    }
    catch (error) {
        console.error('Failed to communicate with LLM:', error);
        return null;
    }
};
exports.determineNextAction = determineNextAction;
//# sourceMappingURL=llm-decision.engine.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.determineNextAction = void 0;
// Feature: LLM | Why: Sends ARIA snapshot + prompt to Gemini and returns the next atomic action chain
const llm_context_builder_1 = require("./llm-context.builder");
const generative_ai_1 = require("@google/generative-ai");
const llm_memory_service_1 = require("./llm-memory-service");
const knowledge_hierarchy_service_1 = require("./knowledge-hierarchy.service");
const llm_decision_prompt_1 = require("./llm-decision-prompt");
const determineNextAction = async (userId, prompt, domMap, screenshotBase64, domain, lookedUpDocs = [], isScholarMode = false, context, ariaSnapshot, apiKeyOverride) => {
    var _a, _b;
    console.log('Sending page state to LLM. Domain:', domain, 'Scholar:', isScholarMode, 'ARIA:', !!ariaSnapshot, 'DOM:', domMap.length);
    const lessons = await (0, llm_memory_service_1.getLessonsLearned)(userId || 'anonymous', prompt);
    const relevantContext = context ? await (0, knowledge_hierarchy_service_1.getRelevantContext)(userId || 'anonymous', context) : '';
    const resolvedPrompt = await (0, llm_context_builder_1.buildGeminiPromptWithMemoryContext)(prompt, domain, lookedUpDocs, isScholarMode);
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
        // Why: prefer GOOGLE_API_KEY (Cloud Run server-side), fall back to EXPO_ for compatibility.
        const geminiKey = apiKeyOverride || process.env.GOOGLE_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
        if (!geminiKey) {
            console.error('[LLM] ❌ STAGE 3 FAIL — no API key in env (GOOGLE_API_KEY / EXPO_PUBLIC_GEMINI_API_KEY)');
            return null;
        }
        console.log(`[LLM] ✅ STAGE 3 — key present (${geminiKey.substring(0, 8)}...), calling gemini-2.5-flash`);
        const genAI = new generative_ai_1.GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const parts = [{ text: llm_decision_prompt_1.DECISION_SYSTEM_INSTRUCTION + '\n\n' + userPayload }];
        if (screenshotBase64) {
            const base64Data = screenshotBase64.split(',')[1] || screenshotBase64;
            parts.push({ inlineData: { data: base64Data, mimeType: 'image/png' } });
        }
        const result = await model.generateContent(parts);
        const llmResponseText = result.response.text();
        if (!llmResponseText) {
            console.error('[LLM] ❌ STAGE 3 FAIL — empty response from Gemini');
            return null;
        }
        const cleanedText = llmResponseText.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleanedText);
        parsed.meta.memoryUsed = cleanedText.toLowerCase().includes('memory') || cleanedText.toLowerCase().includes('historical');
        parsed.meta.intelligenceRating = parsed.meta.memoryUsed ? 95 : 65;
        console.log(`[LLM] ✅ STAGE 3 DONE — plan: "${parsed.execution.plan}" | steps: ${parsed.execution.segments.flatMap(s => s.steps).length}`);
        return parsed;
    }
    catch (error) {
        console.error(`[LLM] ❌ STAGE 3 FAIL — Gemini error: ${(_a = error === null || error === void 0 ? void 0 : error.status) !== null && _a !== void 0 ? _a : ''} ${(_b = error === null || error === void 0 ? void 0 : error.message) !== null && _b !== void 0 ? _b : error}`);
        return null;
    }
};
exports.determineNextAction = determineNextAction;
//# sourceMappingURL=llm-decision.engine.js.map
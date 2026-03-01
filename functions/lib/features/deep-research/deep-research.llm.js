"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchWithLLM = exports.callGemini = void 0;
// Feature: Deep Research Agent | Trace: deep-research-agent.ts
const generative_ai_1 = require("@google/generative-ai");
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
const callGemini = async (prompt, system) => {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const resp = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction: system,
    });
    return resp.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
};
exports.callGemini = callGemini;
const searchWithLLM = async (query) => (0, exports.callGemini)(`Research query: "${query}"\n\nProvide a concise factual summary (3-5 sentences) with any key details, numbers, or sources you know about this topic.`, 'You are a research assistant. Provide accurate, concise summaries. If unsure, state it clearly.');
exports.searchWithLLM = searchWithLLM;
//# sourceMappingURL=deep-research.llm.js.map
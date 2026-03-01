// Feature: Deep Research Agent | Trace: deep-research-agent.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export const callGemini = async (prompt: string, system: string): Promise<string> => {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const resp = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction: system,
    });
    return resp.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
};

export const searchWithLLM = async (query: string): Promise<string> =>
    callGemini(
        `Research query: "${query}"\n\nProvide a concise factual summary (3-5 sentences) with any key details, numbers, or sources you know about this topic.`,
        'You are a research assistant. Provide accurate, concise summaries. If unsure, state it clearly.',
    );

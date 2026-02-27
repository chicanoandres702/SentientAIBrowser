// Feature: LLM | Trace: README.md
import { db } from '../auth/firebase-config';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Tactical Step Planner: Breaks down high-level objectives into granular tactical steps.
 */
export const planTacticalSteps = async (goal: string): Promise<string[]> => {
    console.log(`[TaskPlanner] Planning steps for: ${goal}`);

    const systemInstruction = `You are a tactical mission planner for an autonomous browser agent.
Break down the User Objective into a list of 3-5 logical steps.
Focus on navigation and critical interaction points.
Return ONLY a JSON array of strings.`;

    try {
        const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY || "");
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(`${systemInstruction}\n\nObjective: ${goal}`);
        const text = result.response.text();

        // Clean and parse JSON array
        const cleanedText = text.replace(/```json|```/g, '').trim();
        const steps = JSON.parse(cleanedText);

        if (Array.isArray(steps)) {
            return steps;
        }
        return [goal]; // Fallback to single step
    } catch (error) {
        console.error('[TaskPlanner] Planning failed:', error);
        return [goal];
    }
};

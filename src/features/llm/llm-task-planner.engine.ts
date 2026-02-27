// Feature: LLM | Trace: README.md
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MissionResponse } from "./llm-decision.engine";

/**
 * Tactical Step Planner: High-fidelity goal decomposition using Gemini 2.0 Flash.
 */
export const planTacticalSteps = async (goal: string): Promise<MissionResponse | null> => {
    console.log(`[TaskPlanner] High-Fidelity Planning for: ${goal}`);

    const systemInstruction = `You are a high-level mission architect for an autonomous browser agent.
Break down the User Objective into a multi-segment tactical plan.
Use the 5-nest high fidelity JSON format.

### RESPONSE FORMAT:
{
  "meta": {
    "reasoning": "Medic-style breakdown of how to achieve the goal.",
    "intelligenceRating": 100,
    "intelligenceSignals": ["Key technical hurdles or navigational strategies"],
    "memoryUsed": false
  },
  "execution": {
    "plan": "Summary of the multi-step approach.",
    "segments": [
      {
        "name": "e.g., 'Navigation' or 'Action Execution'",
        "steps": [
          {
            "action": "click | type | wait | done",
            "explanation": "Brief reasoning for this step."
          }
        ]
      }
    ]
  }
}

Return ONLY raw JSON.`;

    try {
        const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY || "");
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent(`${systemInstruction}\n\nObjective: ${goal}`);
        const text = result.response.text();

        const cleanedText = text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanedText) as MissionResponse;
    } catch (error) {
        console.error('[TaskPlanner] High-fidelity planning failed:', error);
        return null;
    }
};

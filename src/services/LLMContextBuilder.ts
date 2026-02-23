import { getHighlyRatedAnswers, SurveyAnswer } from './SurveyMemoryDB';

/**
 * Intercepts the raw user prompt and injects historical memory from the 
 * SQLite database into the LLM system instructions, giving the AI context
 * on what answers have previously avoided disqualification.
 */
export const buildGeminiPromptWithMemoryContext = async (basePrompt: string): Promise<string> => {
    try {
        const historicalAnswers: SurveyAnswer[] = await getHighlyRatedAnswers(10);

        if (historicalAnswers.length === 0) {
            return basePrompt;
        }

        let memoryContextString = "CRITICAL INSTRUCTION - HISTORICAL MEMORY:\n";
        memoryContextString += "Based on previous survey data, the following answers successfully avoided disqualification:\n";

        historicalAnswers.forEach((ans, index) => {
            memoryContextString += `${index + 1}. When asked about "${ans.question_context}", you historically answered: "${ans.answer_given}". (Score: +${ans.success_weight})\n`;
        });

        memoryContextString += "\nYou MUST prioritize giving the above answers if asked similar questions again.\n\n";

        return memoryContextString + "CURRENT OBJECTIVE:\n" + basePrompt;

    } catch (e) {
        console.error("Failed to inject memory context:", e);
        return basePrompt; // Fallback to raw prompt if DB fails
    }
};

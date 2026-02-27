// Feature: LLM | Trace: README.md
import { getHighlyRatedAnswers, SurveyAnswer } from '../../shared/survey-memory-db';
import { getAcademicContext, AcademicMemory } from '../../shared/academic-memory.service';

/**
 * Intercepts the raw user prompt and injects historical memory from the 
 * Firestore database into the LLM system instructions.
 * It is domain-aware: pulling survey data for Swagbucks and academic data for Capella.
 */
export const buildGeminiPromptWithMemoryContext = async (
    basePrompt: string,
    domain?: string,
    lookedUpDocs: any[] = [],
    isScholarMode: boolean = false
): Promise<string> => {
    try {
        let memoryContextString = "";
        let hasMemory = false;

        // Scholar Mode Silo (Academic Focus)
        if (isScholarMode || domain?.includes('capella.edu')) {
            memoryContextString += "MISSION: SCHOLAR - ACADEMIC PROTOCOL ACTIVE\n";
            memoryContextString += "Prioritize academic etiquette, course instructions, and assignment deadlines.\n\n";

            const academicKnowledge: AcademicMemory[] = await getAcademicContext(domain || 'capella.edu');
            if (academicKnowledge.length > 0) {
                hasMemory = true;
                memoryContextString += "ACADEMIC CONTEXT & COURSE DATA:\n";
                academicKnowledge.forEach((item, index) => {
                    memoryContextString += `${index + 1}. [${item.context_type.toUpperCase()}]: ${item.content}\n`;
                });
                memoryContextString += "\n";
            }
        } 
        // Survey Domain Silo (Only if not in Scholar Mode)
        else {
            const historicalAnswers: SurveyAnswer[] = await getHighlyRatedAnswers(10);
            if (historicalAnswers.length > 0) {
                hasMemory = true;
                memoryContextString += "SURVEY MEMORY (Historical Successes):\n";
                historicalAnswers.forEach((ans, index) => {
                    memoryContextString += `${index + 1}. Question: \"${ans.question_context}\" -> Answer: \"${ans.answer_given}\" (+${ans.success_weight})\n`;
                });
                memoryContextString += "\nYou MUST prioritize these verified demographic and persona answers.\n\n";
            }
        }

        // GitHub Knowledge (Available in both silos as general technical base)
        if (lookedUpDocs.length > 0) {
            hasMemory = true;
            memoryContextString += "GITHUB TECHNICAL KNOWLEDGE:\n";
            lookedUpDocs.forEach((doc, index) => {
                memoryContextString += `${index + 1}. [${doc.name}]: ${doc.path}\n`;
            });
            memoryContextString += "\n";
        }

        if (!hasMemory && !memoryContextString) {
            return basePrompt;
        }

        return `SYSTEM INSTRUCTION - DOMAIN CONTEXT:\n${memoryContextString}\nCURRENT OBJECTIVE:\n${basePrompt}`;

    } catch (e) {
        console.error("Failed to inject memory context:", e);
        return basePrompt;
    }
};

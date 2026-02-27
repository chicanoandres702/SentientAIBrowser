"use strict";
// Feature: LLM | Trace: README.md
/**
 * This service manages the connection to the LLM (Large Language Model) API.
 * It sends the condensed DOM map and the user's instructions to determine
 * which element the AI Browser should interact with next.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.determineNextAction = void 0;
const llm_context_builder_1 = require("./llm-context.builder");
const firebase_utils_1 = require("../../shared/firebase.utils");
const generative_ai_1 = require("@google/generative-ai");
const llm_memory_service_1 = require("./llm-memory-service");
const knowledge_hierarchy_service_1 = require("./knowledge-hierarchy.service");
const determineNextAction = async (prompt, domMap, screenshotBase64, domain, lookedUpDocs = [], isScholarMode = false, context) => {
    var _a, _b;
    console.log('Sending DOM map to LLM. Domain:', domain, 'Scholar Mode:', isScholarMode, 'Node Count:', domMap.length);
    // Construct the strictly formatted prompt for the LLM
    const systemInstruction = `You are an advanced autonomous AI web browser agent.
Your objective is to help the user complete tasks on the web efficiently and safely using ATOMIC CHAINS.

### OPERATIONAL GUIDELINES (NEURAL ARCHETYPES):
1. **MISSION: MEDIC (RECURSIVE DEBUGGING)**: Before taking an action, identify the design intent of the page. If an action fails, perform a Root Cause Analysis (RCA).
2. **ATOMIC CHAINING**: You MUST plan sequential actions (e.g., Click input -> Type text -> Click Search) in a single response if the target elements are visible. This drastically improves performance.
3. **DIAGNOSTIC LISTENER**: Monitor the "Action Log". If the browser returns an ERROR message, prioritize diagnosing the error.
4. **ANTI-DRIFT**: Maintain strict focus on the User Objective. Ignore ads or unrelated links.
5. **AUTHENTICATION DETECTION**: If you hit a login/MFA gate, use action "wait_for_user" with a clear explanation.
6. **MEMORY ARCHETYPE**: Use "HISTORICAL MEMORY" to ensure consistency in answers.
7. **GOAL COMPLETION**: Return action "done" as the final step of your final segment.
8. **MISSION: SCHOLAR**: read all instructions and rubrics for academic domains (e.g. capella.edu).
9. **KNOWLEDGE PERSISTENCE (SMART AGENT)**: You MUST use "record_knowledge" whenever you discover critical facts (deadlines, prices, contact info) or navigational rules. You can categorize this data globally or within specific buckets using 'knowledgeContext' (e.g. 'contextId: "PSY101"').

### RESPONSE FORMAT (5-NEST HIGH FIDELITY):
You must respond ONLY with a single JSON object matching this structure:

{
  "meta": {
    "reasoning": "Medic-style logical breakdown of the current state and goal.",
    "intelligenceRating": 0-100,
    "intelligenceSignals": ["List of short, high-level tactical observations about the page structure or goal"],
    "memoryUsed": true/false
  },
  "execution": {
    "plan": "Summary of your overall tactical approach.",
    "segments": [
      {
        "name": "Logical grouping (e.g. 'Authentication' or 'Search Execution')",
        "steps": [
          {
            "action": "click | type | wait | wait_for_user | ask_user | record_knowledge | lookup_documentation | done",
            "targetId": "AI ID from the DOM Map",
            "domContext": {
              "tagName": "Expected tag (e.g. BUTTON)",
              "text": "Expected text/value/placeholder for verification"
            },
            "knowledgeContext": {
               "groupId": "Optional (e.g. School)",
               "contextId": "Optional (e.g. Class Name 'PSY101')",
               "unitId": "Optional (e.g. 'Unit 1')"
            },
            "value": "Input text for 'type' or saved data for 'record_knowledge'",
            "explanation": "Why this specific atomic action is necessary."
          }
        ]
      }
    ]
  }
}

NOTE: Use the provided Screenshot to verify element locations and identify visual blockers (modals, overlays) not obvious in the DOM Map.`;
    const lessons = await (0, llm_memory_service_1.getLessonsLearned)(((_a = firebase_utils_1.auth.currentUser) === null || _a === void 0 ? void 0 : _a.uid) || 'anonymous', prompt);
    const relevantContext = context ? await (0, knowledge_hierarchy_service_1.getRelevantContext)(((_b = firebase_utils_1.auth.currentUser) === null || _b === void 0 ? void 0 : _b.uid) || 'anonymous', context) : '';
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
        const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY || "");
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const parts = [{ text: systemInstruction + '\n\n' + userPayload }];
        if (screenshotBase64) {
            const base64Data = screenshotBase64.split(',')[1] || screenshotBase64;
            parts.push({
                inlineData: {
                    data: base64Data,
                    mimeType: 'image/png'
                }
            });
        }
        const result = await model.generateContent(parts);
        const llmResponseText = result.response.text();
        if (!llmResponseText)
            return null;
        const cleanedText = llmResponseText.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleanedText);
        // Metadata Enrichment
        parsed.meta.memoryUsed = cleanedText.toLowerCase().includes('memory') ||
            cleanedText.toLowerCase().includes('historical');
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
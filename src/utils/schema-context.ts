// Feature: Planning | Why: Builds human-readable + JSON-serialisable schema payloads for LLM prompts
// Schema definitions live in schema-definitions.ts — this file only builds the prompt text and payload.

import { APP_SCHEMAS } from './schema-definitions';

// Re-export so existing imports keep working
export { APP_SCHEMAS } from './schema-definitions';

/**
 * Human-readable text block injected into the LLM system prompt
 * so the planner can reference real data structures.
 */
export const buildSchemaPromptBlock = (): string => {
    const lines: string[] = [
        '### APPLICATION DATA SCHEMAS (use these when planning):',
        '',
    ];

    for (const [name, schema] of Object.entries(APP_SCHEMAS)) {
        if (name === 'allowedActions') {
            lines.push(`**Allowed Step Actions**: ${(schema as string[]).join(', ')}`);
            continue;
        }
        const s = schema as { collection: string; fields: Record<string, string> };
        lines.push(`**${name}** (Firestore: \`${s.collection}\`)`);
        for (const [field, desc] of Object.entries(s.fields)) {
            lines.push(`  - ${field}: ${desc}`);
        }
        lines.push('');
    }

    lines.push('Use record_knowledge to persist important facts into the knowledge collection.');
    lines.push('Use extract_data to pull SurveyData from the page when on a survey dashboard.');
    lines.push('Reference survey_memory when answering questions to check for previously successful answers.');
    lines.push('');
    return lines.join('\n');
};

/**
 * JSON-serialisable schema payload for the /agent/plan request body
 * so the cloud endpoint can inject it into its own Gemini prompt.
 */
export const getSchemaPayload = () => ({
    schemas: APP_SCHEMAS,
    schemaPrompt: buildSchemaPromptBlock(),
});

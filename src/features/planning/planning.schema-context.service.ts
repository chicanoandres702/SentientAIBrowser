// Feature: Planning | Trace: README.md
/*
 * [Parent Feature/Milestone] Planning
 * [Child Task/Issue] Schema context builder
 * [Subtask] Build human-readable schema prompts for LLM planner
 * [Upstream] Schema definitions -> [Downstream] LLM system prompt
 * [Law Check] 50 lines | Passed 100-Line Law
 */

import { APP_SCHEMAS } from './planning.schema-definitions.service';

export { APP_SCHEMAS } from './planning.schema-definitions.service';

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

export const getSchemaPayload = () => ({
  schemas: APP_SCHEMAS,
  schemaPrompt: buildSchemaPromptBlock(),
});

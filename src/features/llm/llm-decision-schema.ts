// Feature: LLM | Why: System instruction for the client-side decision engine — reuses the same prompt
export { DECISION_SYSTEM_INSTRUCTION } from './llm-decision-prompt.shared';

/** Schema reference for the MissionResponse JSON shape — used by client-side validators */
export const MISSION_RESPONSE_SCHEMA = {
  meta: {
    reasoning: 'string (Medic-style breakdown)',
    intelligenceRating: 'number (0-100)',
    intelligenceSignals: 'string[] (tactical observations)',
    memoryUsed: 'boolean',
  },
  execution: {
    plan: 'string (summary of approach)',
    segments: [{
      name: 'string (grouping name)',
      steps: [{
        action: 'click | type | wait | wait_for_user | ask_user | record_knowledge | lookup_documentation | done',
        targetId: 'string (optional)',
        value: 'string (optional)',
        explanation: 'string',
      }],
    }],
  },
};

// Feature: Planning | Trace: README.md
/*
 * [Parent Feature/Milestone] Planning
 * [Child Task/Issue] Schema definitions
 * [Subtask] LLM planner reference schemas (condensed format)
 * [Upstream] Type definitions -> [Downstream] LLM prompt context
 * [Law Check] 100 lines | Passed 100-Line Law
 */

export const APP_SCHEMAS = {
  task: {
    collection: 'task_queues',
    fields: {
      id: 'string',
      title: 'string (actionable task)',
      status: "'pending'|'in_progress'|'completed'|'failed'",
      missionId: 'string?',
      runId: 'string?',
      tabId: 'string?',
      order: 'number?',
      source: "'planner'|'manual'|'fallback'",
      isMission: 'boolean?',
      progress: 'number 0-100',
      subActions: '{ action, goal, status }[]',
      details: 'string?',
      startTime: 'number? (epoch ms)',
      completedTime: 'number? (epoch ms)',
      estimatedDuration: 'number? (ms)',
    },
  },
  mission: {
    collection: 'missions',
    fields: {
      id: 'string',
      userId: 'string',
      goal: 'string',
      status: "'active'|'completed'|'failed'",
      progress: 'number 0-100',
      runId: 'string',
      tabId: 'string',
      taskCount: 'number',
      lastAction: 'string',
      startedAt: 'number (ms)',
      updatedAt: 'number (ms)',
    },
  },
  survey: {
    collection: 'N/A (client-side)',
    fields: {
      id: 'string',
      title: 'string',
      rewardSB: 'number',
      timeMinutes: 'number',
      yieldRatio: 'number',
    },
  },
  surveyAnswer: {
    collection: 'survey_memory',
    fields: {
      question_context: 'string',
      answer_given: 'string',
      success_weight: 'number',
    },
  },
  academic: {
    collection: 'academic_memory',
    fields: {
      domain: 'string',
      course_id: 'string?',
      context_type: "'instruction'|'reading_list'",
      content: 'string',
    },
  },
  knowledge: {
    collection: 'user_knowledge',
    fields: {
      groupId: 'string?',
      contextId: 'string?',
      unitId: 'string?',
      type: "'rule'|'book_info'",
      content: 'string',
    },
  },
  outcome: {
    collection: 'mission_outcomes',
    fields: {
      goal: 'string',
      action: 'string',
      result: "'success'|'failure'",
      observation: 'string',
    },
  },
  allowedActions: [
    'click', 'type', 'wait', 'done', 'wait_for_user', 'ask_user',
    'record_knowledge', 'lookup_documentation', 'scan_dom',
    'navigate', 'open_url', 'verify', 'interact', 'extract_data',
  ],
};

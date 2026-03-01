// Feature: Planning | Why: Raw schema definitions — data structures the LLM planner references
// Separated from builder functions so each file stays under 100 lines

export const APP_SCHEMAS = {
    /** TaskItem — the queue items the user sees */
    task: {
        collection: 'task_queues',
        fields: {
            id: 'string',
            title: 'string — actionable task name',
            status: "'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked_on_user'" as string,
            missionId: 'string? — parent mission id',
            runId: 'string? — mission run identifier',
            tabId: 'string? — active browser tab id',
            order: 'number? — display order within mission',
            source: "'planner' | 'manual' | 'fallback'",
            isMission: 'boolean? — true if this is the top-level mission',
            progress: 'number 0-100',
            subActions: '{ action, goal, explanation, status }[] — hidden background steps',
            details: 'string?',
            startTime: 'number? epoch ms',
            completedTime: 'number? epoch ms',
            estimatedDuration: 'number? ms',
        },
    },

    /** Mission — parent record tracking a multi-step run */
    mission: {
        collection: 'missions',
        fields: {
            id: 'string',
            userId: 'string',
            goal: 'string',
            status: "'active' | 'completed' | 'failed' | 'paused'",
            progress: 'number 0-100',
            runId: 'string — mission run identifier',
            tabId: 'string — browser tab id',
            taskCount: 'number',
            lastAction: 'string',
            startedAt: 'number epoch ms',
            updatedAt: 'number epoch ms',
            schemaVersion: 'number',
        },
    },

    /** SurveyData — parsed survey card on Swagbucks dashboard */
    survey: {
        collection: 'N/A (client-side)',
        fields: {
            id: 'string — DOM AI tag',
            title: 'string',
            rewardStr: 'string e.g. "50 SB"',
            timeStr: 'string e.g. "10 min"',
            rewardSB: 'number',
            timeMinutes: 'number',
            yieldRatio: 'number — SB per minute',
        },
    },

    /** SurveyAnswer — historical answer memory */
    surveyAnswer: {
        collection: 'survey_memory',
        fields: {
            question_context: 'string — the question asked',
            answer_given: 'string — the answer submitted',
            success_weight: 'number — how well this answer performed',
        },
    },

    /** AcademicMemory — academic domain knowledge */
    academic: {
        collection: 'academic_memory',
        fields: {
            domain: 'string — e.g. capella.edu',
            course_id: 'string? — e.g. PSY101',
            context_type: "'instruction' | 'reading_list' | 'etiquette' | 'deadline'",
            content: 'string',
        },
    },

    /** KnowledgeContext — hierarchical user knowledge */
    knowledge: {
        collection: 'user_knowledge',
        fields: {
            groupId: 'string? — e.g. School, Work, Finance',
            contextId: 'string? — e.g. PSY101, ProjectSentinel',
            unitId: 'string? — e.g. Unit1, API_Docs',
            type: "'rule' | 'book_info' | 'breadcrumb'",
            content: 'string',
        },
    },

    /** MissionOutcome — past action results */
    outcome: {
        collection: 'mission_outcomes',
        fields: {
            goal: 'string',
            action: 'string',
            result: "'success' | 'failure'",
            observation: 'string',
        },
    },

    /** MissionStep actions the planner can emit */
    allowedActions: [
        'click', 'type', 'wait', 'done',
        'wait_for_user', 'ask_user',
        'record_knowledge', 'lookup_documentation',
        'scan_dom', 'navigate', 'open_url', 'verify', 'interact', 'extract_data',
    ],
};

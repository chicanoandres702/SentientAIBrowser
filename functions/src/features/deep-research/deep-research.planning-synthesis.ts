// Feature: Deep Research Agent | Trace: deep-research-agent.ts
import { callGemini } from './deep-research.llm';
import { DeepResearchState, TaskStatus } from './deep-research.types';
import { savePlanToMarkdown, saveReportToMarkdown } from './deep-research.persistence';

export const planningNode = async (state: DeepResearchState): Promise<DeepResearchState> => {
    console.log('[DeepResearch] Planning node: generating research plan...');
    const raw = await callGemini(
        `Create a research plan for: "${state.topic}"\n\nReturn ONLY valid JSON array:\n[{"category_name":"string","tasks":[{"task_description":"string","queries":["q1","q2"]}]}]`,
        'You are a research planner. Output only valid JSON with no markdown fences.',
    );

    let parsed: Array<{ category_name: string; tasks: Array<{ task_description: string; queries: string[] }> }>;
    try { parsed = JSON.parse(raw); }
    catch {
        console.error('[DeepResearch] Failed to parse plan JSON, using single-category fallback');
        parsed = [{ category_name: 'General Research', tasks: [{ task_description: state.topic, queries: [state.topic] }] }];
    }

    state.research_plan = parsed.map(cat => ({
        category_name: cat.category_name,
        tasks: cat.tasks.map(t => ({ task_description: t.task_description, status: 'pending' as TaskStatus, queries: t.queries || [], result_summary: '' })),
    }));
    state.current_category_index = 0; state.current_task_index = 0;
    savePlanToMarkdown(state);
    console.log(`[DeepResearch] Plan created: ${state.research_plan.length} categories`);
    return state;
};

export const synthesisNode = async (state: DeepResearchState): Promise<DeepResearchState> => {
    console.log('[DeepResearch] Synthesis node: generating final report...');
    const allResults = Object.entries(state.search_results).map(([q, s]) => `### Query: ${q}\n${s}`).join('\n\n---\n\n');
    state.final_report = await callGemini(
        `Topic: "${state.topic}"\n\nResearch Data:\n${allResults}\n\nWrite a comprehensive, well-structured Markdown report synthesizing all findings. Include sections, key insights, and a conclusion.`,
        'You are a research analyst. Write thorough, accurate Markdown reports.',
    );
    saveReportToMarkdown(state);
    console.log('[DeepResearch] Final report saved.');
    return state;
};

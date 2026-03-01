"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.synthesisNode = exports.planningNode = void 0;
// Feature: Deep Research Agent | Trace: deep-research-agent.ts
const deep_research_llm_1 = require("./deep-research.llm");
const deep_research_persistence_1 = require("./deep-research.persistence");
const planningNode = async (state) => {
    console.log('[DeepResearch] Planning node: generating research plan...');
    const raw = await (0, deep_research_llm_1.callGemini)(`Create a research plan for: "${state.topic}"\n\nReturn ONLY valid JSON array:\n[{"category_name":"string","tasks":[{"task_description":"string","queries":["q1","q2"]}]}]`, 'You are a research planner. Output only valid JSON with no markdown fences.');
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch (_a) {
        console.error('[DeepResearch] Failed to parse plan JSON, using single-category fallback');
        parsed = [{ category_name: 'General Research', tasks: [{ task_description: state.topic, queries: [state.topic] }] }];
    }
    state.research_plan = parsed.map(cat => ({
        category_name: cat.category_name,
        tasks: cat.tasks.map(t => ({ task_description: t.task_description, status: 'pending', queries: t.queries || [], result_summary: '' })),
    }));
    state.current_category_index = 0;
    state.current_task_index = 0;
    (0, deep_research_persistence_1.savePlanToMarkdown)(state);
    console.log(`[DeepResearch] Plan created: ${state.research_plan.length} categories`);
    return state;
};
exports.planningNode = planningNode;
const synthesisNode = async (state) => {
    console.log('[DeepResearch] Synthesis node: generating final report...');
    const allResults = Object.entries(state.search_results).map(([q, s]) => `### Query: ${q}\n${s}`).join('\n\n---\n\n');
    state.final_report = await (0, deep_research_llm_1.callGemini)(`Topic: "${state.topic}"\n\nResearch Data:\n${allResults}\n\nWrite a comprehensive, well-structured Markdown report synthesizing all findings. Include sections, key insights, and a conclusion.`, 'You are a research analyst. Write thorough, accurate Markdown reports.');
    (0, deep_research_persistence_1.saveReportToMarkdown)(state);
    console.log('[DeepResearch] Final report saved.');
    return state;
};
exports.synthesisNode = synthesisNode;
//# sourceMappingURL=deep-research.planning-synthesis.js.map
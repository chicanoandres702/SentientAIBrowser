// Feature: Deep Research Agent | Trace: deep-research-agent.ts
import { DeepResearchState, NextNode } from './deep-research.types';
import { savePlanToMarkdown, saveResultsToJson } from './deep-research.persistence';
import { searchWithLLM } from './deep-research.llm';

class Semaphore {
    private queue: Array<() => void> = [];
    private running = 0;
    constructor(private max: number) {}
    acquire(): Promise<void> { if (this.running < this.max) { this.running++; return Promise.resolve(); } return new Promise(resolve => this.queue.push(resolve)); }
    release(): void { const next = this.queue.shift(); if (next) next(); else this.running--; }
}

export const advanceIndices = (state: DeepResearchState): DeepResearchState => {
    const cat = state.research_plan[state.current_category_index];
    if (!cat) return state;
    if (state.current_task_index + 1 < cat.tasks.length) state.current_task_index++;
    else { state.current_category_index++; state.current_task_index = 0; }
    return state;
};

export const shouldContinue = (state: DeepResearchState): NextNode => {
    if (state.stop_requested || state.error_message) return 'end_run';
    const cat = state.research_plan[state.current_category_index];
    if (!cat) return 'synthesize_report';
    const task = cat.tasks[state.current_task_index];
    if (!task) return 'synthesize_report';
    return 'execute_research';
};

export const researchExecutionNode = async (state: DeepResearchState): Promise<DeepResearchState> => {
    const cat = state.research_plan[state.current_category_index], task = cat?.tasks[state.current_task_index];
    if (!task) return advanceIndices(state);
    console.log(`[DeepResearch] Executing: [${cat.category_name}] ${task.task_description}`);
    task.status = 'in_progress';

    const sem = new Semaphore(state.max_parallel_searches);
    const queries = task.queries.length ? task.queries : [task.task_description];
    const results = await Promise.all(queries.map(async (q) => {
        await sem.acquire();
        try { const summary = await searchWithLLM(q); state.search_results[q] = summary; return summary; }
        catch (e: any) { return `Error searching "${q}": ${e.message}`; }
        finally { sem.release(); }
    }));

    task.result_summary = results.join('\n\n'); task.status = 'completed';
    savePlanToMarkdown(state); saveResultsToJson(state);
    return advanceIndices(state);
};

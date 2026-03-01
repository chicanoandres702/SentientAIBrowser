"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.researchExecutionNode = exports.shouldContinue = exports.advanceIndices = void 0;
const deep_research_persistence_1 = require("./deep-research.persistence");
const deep_research_llm_1 = require("./deep-research.llm");
class Semaphore {
    constructor(max) {
        this.max = max;
        this.queue = [];
        this.running = 0;
    }
    acquire() { if (this.running < this.max) {
        this.running++;
        return Promise.resolve();
    } return new Promise(resolve => this.queue.push(resolve)); }
    release() { const next = this.queue.shift(); if (next)
        next();
    else
        this.running--; }
}
const advanceIndices = (state) => {
    const cat = state.research_plan[state.current_category_index];
    if (!cat)
        return state;
    if (state.current_task_index + 1 < cat.tasks.length)
        state.current_task_index++;
    else {
        state.current_category_index++;
        state.current_task_index = 0;
    }
    return state;
};
exports.advanceIndices = advanceIndices;
const shouldContinue = (state) => {
    if (state.stop_requested || state.error_message)
        return 'end_run';
    const cat = state.research_plan[state.current_category_index];
    if (!cat)
        return 'synthesize_report';
    const task = cat.tasks[state.current_task_index];
    if (!task)
        return 'synthesize_report';
    return 'execute_research';
};
exports.shouldContinue = shouldContinue;
const researchExecutionNode = async (state) => {
    const cat = state.research_plan[state.current_category_index], task = cat === null || cat === void 0 ? void 0 : cat.tasks[state.current_task_index];
    if (!task)
        return (0, exports.advanceIndices)(state);
    console.log(`[DeepResearch] Executing: [${cat.category_name}] ${task.task_description}`);
    task.status = 'in_progress';
    const sem = new Semaphore(state.max_parallel_searches);
    const queries = task.queries.length ? task.queries : [task.task_description];
    const results = await Promise.all(queries.map(async (q) => {
        await sem.acquire();
        try {
            const summary = await (0, deep_research_llm_1.searchWithLLM)(q);
            state.search_results[q] = summary;
            return summary;
        }
        catch (e) {
            return `Error searching "${q}": ${e.message}`;
        }
        finally {
            sem.release();
        }
    }));
    task.result_summary = results.join('\n\n');
    task.status = 'completed';
    (0, deep_research_persistence_1.savePlanToMarkdown)(state);
    (0, deep_research_persistence_1.saveResultsToJson)(state);
    return (0, exports.advanceIndices)(state);
};
exports.researchExecutionNode = researchExecutionNode;
//# sourceMappingURL=deep-research.execution.js.map
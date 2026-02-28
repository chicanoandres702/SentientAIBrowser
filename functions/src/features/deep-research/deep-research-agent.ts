// Feature: Deep Research Agent
// Technique: browser-use/web-ui — Plan→Execute(loop)→Synthesize state machine
//   (deep_research_agent.py: planning_node, research_execution_node, synthesis_node, should_continue)
//
// Key techniques adopted:
//   1. Explicit state machine with typed DeepResearchState (mirrors LangGraph StateGraph)
//   2. Category/task hierarchy with pending/completed/failed status tracking
//   3. Parallel browser searches bounded by a concurrency semaphore
//   4. JSON + Markdown state persistence so runs can be resumed after interruption
//   5. stop_requested flag checked at each node transition

import * as fs from 'fs';
import * as path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// ---------------------------------------------------------------------------
// Types — mirrors browser-use/web-ui DeepResearchState / ResearchCategoryItem
// ---------------------------------------------------------------------------

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface ResearchTaskItem {
    task_description: string;
    status: TaskStatus;
    queries: string[];
    result_summary: string;
}

export interface ResearchCategoryItem {
    category_name: string;
    tasks: ResearchTaskItem[];
}

export interface DeepResearchState {
    topic: string;
    research_plan: ResearchCategoryItem[];
    current_category_index: number;
    current_task_index: number;
    search_results: Record<string, string>;  // query → summary
    final_report: string;
    stop_requested: boolean;
    error_message: string;
    output_dir: string;
    max_parallel_searches: number;
}

// ---------------------------------------------------------------------------
// State persistence helpers
// ---------------------------------------------------------------------------

const PLAN_FILENAME    = 'research_plan.md';
const RESULTS_FILENAME = 'search_results.json';
const REPORT_FILENAME  = 'final_report.md';

function savePlanToMarkdown(state: DeepResearchState): void {
    const lines: string[] = [`# Research Plan: ${state.topic}\n`];
    for (const cat of state.research_plan) {
        lines.push(`## ${cat.category_name}`);
        for (const task of cat.tasks) {
            const box = task.status === 'completed' ? '[x]' : task.status === 'failed' ? '[-]' : '[ ]';
            lines.push(`- ${box} ${task.task_description}`);
        }
        lines.push('');
    }
    fs.writeFileSync(path.join(state.output_dir, PLAN_FILENAME), lines.join('\n'), 'utf-8');
}

function saveResultsToJson(state: DeepResearchState): void {
    fs.writeFileSync(
        path.join(state.output_dir, RESULTS_FILENAME),
        JSON.stringify(state.search_results, null, 2),
        'utf-8'
    );
}

function saveReportToMarkdown(state: DeepResearchState): void {
    fs.writeFileSync(path.join(state.output_dir, REPORT_FILENAME), state.final_report, 'utf-8');
}

/** Re-hydrate state from saved plan.md + search_results.json if they exist */
function loadPreviousState(outputDir: string): Partial<DeepResearchState> | null {
    const planPath    = path.join(outputDir, PLAN_FILENAME);
    const resultsPath = path.join(outputDir, RESULTS_FILENAME);
    if (!fs.existsSync(planPath)) return null;

    const plan: ResearchCategoryItem[] = [];
    let currentCat: ResearchCategoryItem | null = null;

    for (const line of fs.readFileSync(planPath, 'utf-8').split('\n')) {
        if (line.startsWith('## ')) {
            currentCat = { category_name: line.slice(3).trim(), tasks: [] };
            plan.push(currentCat);
        } else if (line.startsWith('- ') && currentCat) {
            const completed = line.includes('[x]');
            const failed    = line.includes('[-]');
            const desc      = line.replace(/^- \[.\] /, '').trim();
            currentCat.tasks.push({
                task_description: desc,
                status: completed ? 'completed' : failed ? 'failed' : 'pending',
                queries: [],
                result_summary: '',
            });
        }
    }

    const searchResults: Record<string, string> = fs.existsSync(resultsPath)
        ? JSON.parse(fs.readFileSync(resultsPath, 'utf-8'))
        : {};

    // Resume from the first pending task
    let catIdx = 0, taskIdx = 0;
    outer: for (let c = 0; c < plan.length; c++) {
        for (let t = 0; t < plan[c].tasks.length; t++) {
            if (plan[c].tasks[t].status === 'pending') {
                catIdx = c; taskIdx = t;
                break outer;
            }
        }
        catIdx = plan.length; // all done
    }

    return { research_plan: plan, current_category_index: catIdx, current_task_index: taskIdx, search_results: searchResults };
}

// ---------------------------------------------------------------------------
// Semaphore — browser-use/web-ui uses asyncio.Semaphore for parallel search
// ---------------------------------------------------------------------------

class Semaphore {
    private queue: Array<() => void> = [];
    private running = 0;
    constructor(private max: number) {}

    acquire(): Promise<void> {
        if (this.running < this.max) { this.running++; return Promise.resolve(); }
        return new Promise(resolve => this.queue.push(resolve));
    }

    release(): void {
        const next = this.queue.shift();
        if (next) { next(); } else { this.running--; }
    }
}

// ---------------------------------------------------------------------------
// LLM helpers
// ---------------------------------------------------------------------------

async function callGemini(prompt: string, system: string): Promise<string> {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const resp = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction: system,
    });
    return resp.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}

/** Simulates a browser search using Gemini knowledge (no real browser needed for pure research) */
async function searchWithLLM(query: string): Promise<string> {
    const result = await callGemini(
        `Research query: "${query}"\n\nProvide a concise factual summary (3-5 sentences) with any key details, numbers, or sources you know about this topic.`,
        'You are a research assistant. Provide accurate, concise summaries. If unsure, state it clearly.'
    );
    return result;
}

// ---------------------------------------------------------------------------
// State machine nodes — mirrors browser-use/web-ui planning_node, etc.
// ---------------------------------------------------------------------------

async function planningNode(state: DeepResearchState): Promise<DeepResearchState> {
    console.log('[DeepResearch] Planning node: generating research plan...');
    const raw = await callGemini(
        `Create a research plan for: "${state.topic}"\n\nReturn ONLY valid JSON array:\n[{"category_name":"string","tasks":[{"task_description":"string","queries":["q1","q2"]}]}]`,
        'You are a research planner. Output only valid JSON with no markdown fences.'
    );

    let parsed: Array<{ category_name: string; tasks: Array<{ task_description: string; queries: string[] }> }>;
    try {
        parsed = JSON.parse(raw);
    } catch {
        console.error('[DeepResearch] Failed to parse plan JSON, using single-category fallback');
        parsed = [{ category_name: 'General Research', tasks: [{ task_description: state.topic, queries: [state.topic] }] }];
    }

    state.research_plan = parsed.map(cat => ({
        category_name: cat.category_name,
        tasks: cat.tasks.map(t => ({ task_description: t.task_description, status: 'pending' as TaskStatus, queries: t.queries || [], result_summary: '' })),
    }));
    state.current_category_index = 0;
    state.current_task_index = 0;

    savePlanToMarkdown(state);
    console.log(`[DeepResearch] Plan created: ${state.research_plan.length} categories`);
    return state;
}

async function researchExecutionNode(state: DeepResearchState): Promise<DeepResearchState> {
    const cat  = state.research_plan[state.current_category_index];
    const task = cat?.tasks[state.current_task_index];
    if (!task) return advanceIndices(state);

    console.log(`[DeepResearch] Executing: [${cat.category_name}] ${task.task_description}`);
    task.status = 'in_progress';

    // --- browser-use/web-ui: parallel searches bounded by semaphore ---
    const sem = new Semaphore(state.max_parallel_searches);
    const queries = task.queries.length ? task.queries : [task.task_description];

    const results = await Promise.all(queries.map(async (q) => {
        await sem.acquire();
        try {
            const summary = await searchWithLLM(q);
            state.search_results[q] = summary;
            return summary;
        } catch (e: any) {
            return `Error searching "${q}": ${e.message}`;
        } finally {
            sem.release();
        }
    }));

    task.result_summary = results.join('\n\n');
    task.status = 'completed';

    savePlanToMarkdown(state);
    saveResultsToJson(state);
    return advanceIndices(state);
}

async function synthesisNode(state: DeepResearchState): Promise<DeepResearchState> {
    console.log('[DeepResearch] Synthesis node: generating final report...');
    const allResults = Object.entries(state.search_results)
        .map(([q, s]) => `### Query: ${q}\n${s}`)
        .join('\n\n---\n\n');

    state.final_report = await callGemini(
        `Topic: "${state.topic}"\n\nResearch Data:\n${allResults}\n\nWrite a comprehensive, well-structured Markdown report synthesizing all findings. Include sections, key insights, and a conclusion.`,
        'You are a research analyst. Write thorough, accurate Markdown reports.'
    );

    saveReportToMarkdown(state);
    console.log('[DeepResearch] Final report saved.');
    return state;
}

/** Advance to the next task/category — mirrors browser-use/web-ui index management */
function advanceIndices(state: DeepResearchState): DeepResearchState {
    const cat = state.research_plan[state.current_category_index];
    if (!cat) return state;

    if (state.current_task_index + 1 < cat.tasks.length) {
        state.current_task_index++;
    } else {
        state.current_category_index++;
        state.current_task_index = 0;
    }
    return state;
}

/** Edge function — mirrors browser-use/web-ui should_continue conditional edge */
type NextNode = 'execute_research' | 'synthesize_report' | 'end_run';

function shouldContinue(state: DeepResearchState): NextNode {
    if (state.stop_requested || state.error_message) return 'end_run';

    const cat = state.research_plan[state.current_category_index];
    if (!cat) return 'synthesize_report';

    const task = cat.tasks[state.current_task_index];
    if (!task) return 'synthesize_report';

    return 'execute_research';
}

// ---------------------------------------------------------------------------
// DeepResearchAgent class
// ---------------------------------------------------------------------------

export interface RunResult {
    status: 'completed' | 'stopped' | 'failed';
    report?: string;
    outputDir: string;
    taskId: string;
}

export class DeepResearchAgent {
    private stopRequested = false;

    constructor(private maxParallelSearches = 3) {}

    stop(): void { this.stopRequested = true; }

    async run(topic: string, taskId: string, outputDir: string): Promise<RunResult> {
        fs.mkdirSync(outputDir, { recursive: true });

        // --- browser-use/web-ui: resume if previous state exists ---
        const previous = loadPreviousState(outputDir);
        const state: DeepResearchState = {
            topic,
            research_plan: previous?.research_plan || [],
            current_category_index: previous?.current_category_index ?? 0,
            current_task_index: previous?.current_task_index ?? 0,
            search_results: previous?.search_results || {},
            final_report: '',
            stop_requested: false,
            error_message: '',
            output_dir: outputDir,
            max_parallel_searches: this.maxParallelSearches,
        };

        if (previous) {
            console.log(`[DeepResearch] Resuming task ${taskId} from cat=${state.current_category_index} task=${state.current_task_index}`);
        }

        try {
            // Planning phase (skip if resuming with an existing plan)
            if (!state.research_plan.length) {
                await planningNode(state);
            }

            // --- browser-use/web-ui graph loop: execute_research ⇄ synthesize_report ---
            let next: NextNode = shouldContinue(state);
            while (next !== 'end_run') {
                state.stop_requested = this.stopRequested;
                if (next === 'execute_research') {
                    await researchExecutionNode(state);
                } else if (next === 'synthesize_report') {
                    await synthesisNode(state);
                    break;
                }
                next = shouldContinue(state);
            }

            if (state.stop_requested) return { status: 'stopped', outputDir, taskId };

            return { status: 'completed', report: state.final_report, outputDir, taskId };
        } catch (e: any) {
            console.error(`[DeepResearch] Fatal error in task ${taskId}:`, e.message);
            return { status: 'failed', outputDir, taskId };
        }
    }
}

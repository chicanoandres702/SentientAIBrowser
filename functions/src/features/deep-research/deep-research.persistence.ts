// Feature: Deep Research Agent | Trace: deep-research-agent.ts
import * as fs from 'fs';
import * as path from 'path';
import { DeepResearchState, ResearchCategoryItem } from './deep-research.types';

export const PLAN_FILENAME = 'research_plan.md';
export const RESULTS_FILENAME = 'search_results.json';
export const REPORT_FILENAME = 'final_report.md';

export const savePlanToMarkdown = (state: DeepResearchState): void => {
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
};

export const saveResultsToJson = (state: DeepResearchState): void => {
    fs.writeFileSync(path.join(state.output_dir, RESULTS_FILENAME), JSON.stringify(state.search_results, null, 2), 'utf-8');
};

export const saveReportToMarkdown = (state: DeepResearchState): void => {
    fs.writeFileSync(path.join(state.output_dir, REPORT_FILENAME), state.final_report, 'utf-8');
};

export const loadPreviousState = (outputDir: string): Partial<DeepResearchState> | null => {
    const planPath = path.join(outputDir, PLAN_FILENAME), resultsPath = path.join(outputDir, RESULTS_FILENAME);
    if (!fs.existsSync(planPath)) return null;
    const plan: ResearchCategoryItem[] = []; let currentCat: ResearchCategoryItem | null = null;
    for (const line of fs.readFileSync(planPath, 'utf-8').split('\n')) {
        if (line.startsWith('## ')) { currentCat = { category_name: line.slice(3).trim(), tasks: [] }; plan.push(currentCat); }
        else if (line.startsWith('- ') && currentCat) {
            const completed = line.includes('[x]'), failed = line.includes('[-]');
            currentCat.tasks.push({ task_description: line.replace(/^- \[.\] /, '').trim(), status: completed ? 'completed' : failed ? 'failed' : 'pending', queries: [], result_summary: '' });
        }
    }
    const searchResults: Record<string, string> = fs.existsSync(resultsPath) ? JSON.parse(fs.readFileSync(resultsPath, 'utf-8')) : {};
    let catIdx = 0, taskIdx = 0;
    outer: for (let c = 0; c < plan.length; c++) {
        for (let t = 0; t < plan[c].tasks.length; t++) {
            if (plan[c].tasks[t].status === 'pending') { catIdx = c; taskIdx = t; break outer; }
        }
        catIdx = plan.length;
    }
    return { research_plan: plan, current_category_index: catIdx, current_task_index: taskIdx, search_results: searchResults };
};

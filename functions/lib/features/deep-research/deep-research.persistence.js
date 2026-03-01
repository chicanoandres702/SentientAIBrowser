"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadPreviousState = exports.saveReportToMarkdown = exports.saveResultsToJson = exports.savePlanToMarkdown = exports.REPORT_FILENAME = exports.RESULTS_FILENAME = exports.PLAN_FILENAME = void 0;
// Feature: Deep Research Agent | Trace: deep-research-agent.ts
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
exports.PLAN_FILENAME = 'research_plan.md';
exports.RESULTS_FILENAME = 'search_results.json';
exports.REPORT_FILENAME = 'final_report.md';
const savePlanToMarkdown = (state) => {
    const lines = [`# Research Plan: ${state.topic}\n`];
    for (const cat of state.research_plan) {
        lines.push(`## ${cat.category_name}`);
        for (const task of cat.tasks) {
            const box = task.status === 'completed' ? '[x]' : task.status === 'failed' ? '[-]' : '[ ]';
            lines.push(`- ${box} ${task.task_description}`);
        }
        lines.push('');
    }
    fs.writeFileSync(path.join(state.output_dir, exports.PLAN_FILENAME), lines.join('\n'), 'utf-8');
};
exports.savePlanToMarkdown = savePlanToMarkdown;
const saveResultsToJson = (state) => {
    fs.writeFileSync(path.join(state.output_dir, exports.RESULTS_FILENAME), JSON.stringify(state.search_results, null, 2), 'utf-8');
};
exports.saveResultsToJson = saveResultsToJson;
const saveReportToMarkdown = (state) => {
    fs.writeFileSync(path.join(state.output_dir, exports.REPORT_FILENAME), state.final_report, 'utf-8');
};
exports.saveReportToMarkdown = saveReportToMarkdown;
const loadPreviousState = (outputDir) => {
    const planPath = path.join(outputDir, exports.PLAN_FILENAME), resultsPath = path.join(outputDir, exports.RESULTS_FILENAME);
    if (!fs.existsSync(planPath))
        return null;
    const plan = [];
    let currentCat = null;
    for (const line of fs.readFileSync(planPath, 'utf-8').split('\n')) {
        if (line.startsWith('## ')) {
            currentCat = { category_name: line.slice(3).trim(), tasks: [] };
            plan.push(currentCat);
        }
        else if (line.startsWith('- ') && currentCat) {
            const completed = line.includes('[x]'), failed = line.includes('[-]');
            currentCat.tasks.push({ task_description: line.replace(/^- \[.\] /, '').trim(), status: completed ? 'completed' : failed ? 'failed' : 'pending', queries: [], result_summary: '' });
        }
    }
    const searchResults = fs.existsSync(resultsPath) ? JSON.parse(fs.readFileSync(resultsPath, 'utf-8')) : {};
    let catIdx = 0, taskIdx = 0;
    outer: for (let c = 0; c < plan.length; c++) {
        for (let t = 0; t < plan[c].tasks.length; t++) {
            if (plan[c].tasks[t].status === 'pending') {
                catIdx = c;
                taskIdx = t;
                break outer;
            }
        }
        catIdx = plan.length;
    }
    return { research_plan: plan, current_category_index: catIdx, current_task_index: taskIdx, search_results: searchResults };
};
exports.loadPreviousState = loadPreviousState;
//# sourceMappingURL=deep-research.persistence.js.map
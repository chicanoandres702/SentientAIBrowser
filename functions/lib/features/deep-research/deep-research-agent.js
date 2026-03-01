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
exports.DeepResearchAgent = void 0;
// Feature: Deep Research Agent | Trace: README.md
const fs = __importStar(require("fs"));
const deep_research_persistence_1 = require("./deep-research.persistence");
const deep_research_planning_synthesis_1 = require("./deep-research.planning-synthesis");
const deep_research_execution_1 = require("./deep-research.execution");
class DeepResearchAgent {
    constructor(maxParallelSearches = 3) {
        this.maxParallelSearches = maxParallelSearches;
        this.stopRequested = false;
    }
    stop() { this.stopRequested = true; }
    async run(topic, taskId, outputDir) {
        var _a, _b;
        fs.mkdirSync(outputDir, { recursive: true });
        const previous = (0, deep_research_persistence_1.loadPreviousState)(outputDir);
        const state = {
            topic,
            research_plan: (previous === null || previous === void 0 ? void 0 : previous.research_plan) || [],
            current_category_index: (_a = previous === null || previous === void 0 ? void 0 : previous.current_category_index) !== null && _a !== void 0 ? _a : 0,
            current_task_index: (_b = previous === null || previous === void 0 ? void 0 : previous.current_task_index) !== null && _b !== void 0 ? _b : 0,
            search_results: (previous === null || previous === void 0 ? void 0 : previous.search_results) || {},
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
            if (!state.research_plan.length)
                await (0, deep_research_planning_synthesis_1.planningNode)(state);
            let next = (0, deep_research_execution_1.shouldContinue)(state);
            while (next !== 'end_run') {
                state.stop_requested = this.stopRequested;
                if (next === 'execute_research')
                    await (0, deep_research_execution_1.researchExecutionNode)(state);
                else if (next === 'synthesize_report') {
                    await (0, deep_research_planning_synthesis_1.synthesisNode)(state);
                    break;
                }
                next = (0, deep_research_execution_1.shouldContinue)(state);
            }
            if (state.stop_requested)
                return { status: 'stopped', outputDir, taskId };
            return { status: 'completed', report: state.final_report, outputDir, taskId };
        }
        catch (e) {
            console.error(`[DeepResearch] Fatal error in task ${taskId}:`, e.message);
            return { status: 'failed', outputDir, taskId };
        }
    }
}
exports.DeepResearchAgent = DeepResearchAgent;
//# sourceMappingURL=deep-research-agent.js.map
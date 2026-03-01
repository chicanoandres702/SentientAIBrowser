// Feature: Deep Research Agent | Trace: README.md
import * as fs from 'fs';
import { DeepResearchState, NextNode, RunResult } from './deep-research.types';
import { loadPreviousState } from './deep-research.persistence';
import { planningNode, synthesisNode } from './deep-research.planning-synthesis';
import { researchExecutionNode, shouldContinue } from './deep-research.execution';

export class DeepResearchAgent {
    private stopRequested = false;

    constructor(private maxParallelSearches = 3) {}

    stop(): void { this.stopRequested = true; }

    async run(topic: string, taskId: string, outputDir: string): Promise<RunResult> {
        fs.mkdirSync(outputDir, { recursive: true });

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
            if (!state.research_plan.length) await planningNode(state);
            let next: NextNode = shouldContinue(state);
            while (next !== 'end_run') {
                state.stop_requested = this.stopRequested;
                if (next === 'execute_research') await researchExecutionNode(state);
                else if (next === 'synthesize_report') { await synthesisNode(state); break; }
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

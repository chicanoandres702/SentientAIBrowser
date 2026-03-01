// Feature: Deep Research Agent | Trace: deep-research-agent.ts
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
    search_results: Record<string, string>;
    final_report: string;
    stop_requested: boolean;
    error_message: string;
    output_dir: string;
    max_parallel_searches: number;
}

export interface RunResult {
    status: 'completed' | 'stopped' | 'failed';
    report?: string;
    outputDir: string;
    taskId: string;
}

export type NextNode = 'execute_research' | 'synthesize_report' | 'end_run';

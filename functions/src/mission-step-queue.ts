/**
 * Sentient File Header
 * Why: Mission step queue and task document creation for Sentient AI Browser
 * Filepath: functions/src/mission-step-queue.ts
 * Description: Creates step queue and task docs for mission execution
 * Trace: Used by backend, orchestrator, and mission executor modules
 * Wiring: Exported function, consumed by backend and orchestrator
 */
// Feature: Mission Executor | Trace: functions/src/mission-step-queue.ts
/*
 * [Extracted Logic] Step queue and task document creation for mission execution
 * [Law Check] < 100 lines
 */
import { AriaStep } from './playwright-mcp-adapter';

export function createTaskDocs(stepQueue: AriaStep[]): any[] {
  return stepQueue.map((step, i) => ({
    id: `step-${Date.now()}-${i}`,
    action: step.action,
    explanation: step.explanation,
    title: `${step.action}: ${step.explanation}`.substring(0, 80),
    status: 'pending',
  }));
}

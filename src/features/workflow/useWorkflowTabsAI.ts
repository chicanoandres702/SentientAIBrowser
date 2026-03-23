/**
 * Sentient File Header
 * Why: Enables AI-driven tab workflow confidence logic for Sentient Browser
 * Filepath: src/features/workflow/useWorkflowTabsAI.ts
 * Description: Provides AI decision logic for workflow tab actions and confidence levels
 * Trace: Used by WorkflowTabs, WorkflowPanel, and orchestrator gates
 * Wiring: Exported hook, consumed by workflow features and orchestrator
 */
// Feature: Workflow Tabs AI | Trace: src/features/workflow/useWorkflowTabsAI.ts
export function useWorkflowTabsAI() {
  function aiStepConfidenceDecision(action: string, context: string) {
    if (context.includes('ambiguous') || (action === 'modify' && context === 'uncertain')) {
      return {
        confidence: 0.3,
        options: ['Retry', 'Skip', 'Request Clarification'],
        question: 'AI is unsure how to modify this step. What should happen next?',
      };
    }
    if (action === 'replan' && context === 'uncertain') {
      return {
        confidence: 0.4,
        options: ['Retry', 'Replan', 'Request Clarification'],
        question: 'AI is unsure how to replan. What should happen next?',
      };
    }
    return {
      confidence: 0.9,
      options: ['Continue'],
      question: 'AI is confident. Continue?',
    };
  }
  function aiConfidenceDecision(context: string) {
    if (context.includes('ambiguous')) {
      return {
        confidence: 0.4,
        options: ['Retry', 'Skip', 'Request Clarification'],
        question: 'AI is unsure how to proceed. What should happen next?',
      };
    }
    return {
      confidence: 0.9,
      options: ['Continue'],
      question: 'AI is confident. Continue?',
    };
  }
  return { aiStepConfidenceDecision, aiConfidenceDecision };
}

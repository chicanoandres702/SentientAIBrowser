# Feature: Agent Trace

## Overview
This feature manages high-level mission orchestration and tactical planning. It bridges user input with the background execution loops.

## Core Files
- `AgentService.ts`: Coordinates mission creation and LLM-based planning.
- `llm-task-planner.engine.ts`: Breaks down user goals into granular steps.

## Status: Operational
- Mission start flow: Integrated in `useBrowserController.ts`.
- Backend processing: Handled by `BackendAIOrchestrator` in Cloud Functions.

## Web-UI-1 Techniques (Ported)

> **Origin:** `C:\Users\Andrew\OneDrive\Documents\Coding\web-ui-1`
> **Report:** See `/RESEARCH_REPORT_WEB_UI_1.md` for full source analysis

| Service | Source Pattern | File |
|---------|---------------|------|
| Agent Heuristics | `AgentHeuristics` class | `agent-heuristics.service.ts` |
| Model Switcher | `manage_model_switching()` | `model-switcher.service.ts` |
| Mission State Machine | LangGraph `StateGraph` | `mission-state-machine.ts` |
| Action Registry | `Controller` + 6 Mixins | `action-registry.service.ts` |
| Action Mixins | `NavigationActionsMixin` etc. | `action-mixins.service.ts` |
| Confirmer | `confirmer_llm` validation | `confirmer.service.ts` |
| Quiz State Tracker | `QuizStateManager` | `quiz-state.tracker.ts` |
| View Clearing Pipeline | `clear_view` 5-stage | `browser/services/view-clearing.pipeline.ts` |
| Smart Action Executor | `smart_click` + retry | `browser/services/smart-action.executor.ts` |

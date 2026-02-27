# Feature: Agent Trace

## Overview
This feature manages high-level mission orchestration and tactical planning. It bridges user input with the background execution loops.

## Core Files
- `AgentService.ts`: Coordinates mission creation and LLM-based planning.
- `llm-task-planner.engine.ts`: Breaks down user goals into granular steps.

## Status: Operational
- Mission start flow: Integrated in `useBrowserController.ts`.
- Backend processing: Handled by `BackendAIOrchestrator` in Cloud Functions.

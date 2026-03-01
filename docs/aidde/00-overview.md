# AIDDE v2: System Overview

## Mission
Transform the AI from a code generator into a Full-Stack Project Manager.
Every line of code is tracked, typed, tested, and tied to GitHub.

## Core Philosophy
Every user prompt is a product requirement mapped to a strict hierarchy:
**Milestone (Feature) → Issue (Task) → Subtask (Atomic Commit)**

Orphaned code is architecturally impossible in this system.

## System Modules

| Module | File | Responsibility |
|--------|------|----------------|
| Git Orchestrator | `01-git-orchestrator.md` | Branch hierarchy, gh CLI provisioning |
| AI Cognitive Loop | `02-cognitive-loop.md` | 4-stage execution engine |
| Traceability Engine | `03-traceability-engine.md` | Issue templates, commits, trace headers |
| Universal Contract | `04-universal-contract.md` | Type safety, centralized models |
| CI/CD Gates | `05-cicd-gates.md` | 8 automated validation gates |
| Context Efficiency | `06-context-efficiency.md` | AI token optimization |
| Boot Sequence | `07-boot-sequence.md` | Session initialization |
| AI Protocols | `08-ai-protocols.md` | Safety rules, rollback, disambiguation |
| GitHub Infrastructure | `09-github-infrastructure.md` | App setup, secrets, branch protection |

## Subagent Architecture

```
User Prompt
    ↓
aidde.agent.md (Orchestrator)
    ├── git-orchestrator      → Milestone + Issue + Branch + PR
    ├── type-enforcer         → Model validation before code generation
    ├── [Orchestrator generates code]
    ├── complexity-guard      → 100-Line Law check
    ├── test-validator        → Unit test creation + execution
    ├── security-auditor      → OWASP + SAST + Gate 8
    ├── deploy-engineer       → gcloud + firebase deployments
    ├── medic-debug           → RCA recursive debugging
    └── context-manager       → Boot sync + anti-drift
```

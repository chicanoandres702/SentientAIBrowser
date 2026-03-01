# Feature: GitHub Tracer

## Purpose
Auto-creates GitHub Issues and feature branches for every mission and orchestrator
decision cycle so all AI-driven actions are traceable inside the repository's Issue tree.

## AI_CONSTITUTION Rules Implemented
| Rule | Implementation |
|---|---|
| §6 Issue Hierarchy | `openMissionIssue` → Epic; `openStepIssue` → Task child |
| §6.2 Explicit Linkage | Step issues contain `Part of #<epicNum>` |
| §8 Path Law | Branch: `mission/<missionId>/step-<N>-<slug>-#<issue>` |
| §9.1 Header Mandate | File header links to this trace |

## Key Interfaces
```ts
openMissionIssue(missionId: string, goal: string): Promise<number | null>
openStepIssue(missionId: string, stepNum: number, description: string, parentIssueNum: number): Promise<number | null>
closeMissionIssue(issueNum: number, status: 'completed' | 'failed'): Promise<void>
```

## Required Environment Variables
| Variable | Description |
|---|---|
| `GITHUB_TOKEN` | Personal Access Token with `repo` + `issues` scopes |
| `GITHUB_OWNER` | Repository owner (username or org) |
| `GITHUB_REPO` | Repository name |

## Graceful Degradation
All functions are no-ops when env vars are absent — the orchestrator works normally.

## Dependency Graph
`backend-mission-loop.ts` → `github-tracer.service.ts` → GitHub REST API

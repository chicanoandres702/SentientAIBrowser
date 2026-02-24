---
description: Automated creation of Milestones, Parent Issues (Epics), and Child Issues with associated branches using GH CLI.
---

# GitHub Tree Orchestrator Workflow

This workflow implements a hierarchical "Tree" structure for project management, ensuring that every piece of work is traceable from its specific task branch up to a high-level Milestone.

## 1. Milestone Initialization
Ensure a clear delivery target exists.
- **Action**: `gh milestone create --title "v1.x: <Goal>" --description "<Description>"`
- **Rule**: Every Milestone must align with a specific quadrant in `src/features/` to prevent context poisoning.

## 2. Epic (Parent Issue) Creation
Create the high-level technical requirement using High-Fidelity standards.
- **Action**: `gh issue create --title "Epic: <Feature Name>" --body "<Epic_Template_Markdown>" --milestone "v1.x: <Goal>"`
- **Rule**: The body must use Alerts to emphasize goals and a Mermaid diagram to visualize the implementation flow.

## 3. Task (Child Issue) Proliferation
Break the Epic into modular units using High-Fidelity standards.
- **Action**: For each sub-task:
  `gh issue create --title "<Type>(<Area>): <Task Name>" --body "<Task_Template_Markdown>" --milestone "v1.x: <Goal>"`
- **Rule**: Every Child Issue must include technical prerequisites, explicit success criteria, and a reference back to the Epic (#ID).
- **Complexity**: Tasks must be solvable in under 100 lines of logic.

## 4. Hierarchical Branch Proliferation
Associate code paths with technical tasks using a path-based model.
- **Parent Branch (Epic)**: `git checkout -b (feature or milestone)/<slug>` (off `main`)
- **Child Branch (Task)**: `git checkout -b (feature or milestone)/<slug>/<task-slug>` (**off the Parent branch**)
- **Rule**: No direct commits to Parent branches; all work happens in Child (task) branches.

## 5. Mandatory PR Strategy
Enforce quality checks at every level.
- **Task Level**: Open a PR from `.../slug/task-slug` to its parent `.../slug` branch once a child issue is ready.
- **Feature Level**: Once all Child PRs are merged into the Parent branch, open a final PR into `main`.
- **Review Requirement**: Every PR must pass automated CI checks (and human review if possible) before merging.

# Strict Branch Hierarchy Workflow

## Overview
This workflow enforces:
- Parent branch for each feature/milestone: `feature/<milestone-slug>`
- Sub-branch for each task/issue: `feature/<milestone-slug>/task/<issue-slug>`
- Every branch is always associated with a milestone and issue—no orphans allowed.
- Naming conventions are enforced by pre-push hook.
- Automation script for branch creation, association, and navigation.

## Usage

### 1. Create or switch to the correct branch
Run:
```sh
./scripts/branch-workflow.sh <milestone-slug> <issue-slug>
```
This will:
- Check for and create the parent feature/milestone branch if needed
- Check for and create the sub-branch for the task/issue if needed
- Switch to the correct branch, stashing changes if necessary

### 2. Pre-push hook enforcement
The `.git/hooks/pre-push` script will:
- Prevent pushing from any branch that does not follow the strict hierarchy
- (Optional) Can be extended to check GitHub issue/milestone association

## Example
- Milestone: `core-automation`
- Issue: `sync-todos`
- Branch: `feature/core-automation/task/sync-todos`

## Best Practices
- Always use the script to create/switch branches
- Reference branch and issue in commit messages
- Keep all actionable and aspirational ideas in your issue/task checklist

## Customization
- Extend the script and hook for more checks (e.g., GitHub API validation)
- Update the checklist template as your workflow evolves

---
This workflow keeps your project organized, traceable, and future-proof.

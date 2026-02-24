---
description: Unified master workflow to initialize a project with all Gold Standard configurations.
---

# Project Launch Master Workflow

This workflow orchestrates several specialized scaffolders to ensure the project starts in a "Gold Standard" state, fully aligned with the AI Constitution.

## 1. Initial State Check
Before launching, ensure the core project files exist.
- **Action**: Run `git init` and establish the `main` branch.

## 2. Token Economy Setup
Protect the AI context from noise immediately.
- **Action**: Run `/scaffold_aiignore`.
- **Result**: `.aiignore` and `.cursorignore` are created with standard blocklists.

## 3. Policy & Quality Enforcement
Set up the automated guardians of the code.
- **Action**: Run `/setup_linter_config`.
- **Action**: Run `/git_hooks_setup`.
- **Result**: Husky hooks and Linting configurations are ready to enforce the 100-Line Law.

## 4. Documentation & Identity
Set up the "front door" and architectural records.
- **Action**: Run `/scaffold_readme`.
- **Action**: Run `/scaffold_docs_architecture`.
- **Action**: Ensure `AI_CONSTITUTION.md` is present in the root.

## 5. Security & Lifecycle
- **Action**: Create `.github/dependabot.yml` using the standard template.
- **Action**: Ensure `/documentation-lifecycle` is reviewed by the team.

## 6. Execution
- Run `npm run sync-credentials` (if applicable) to finalize the setup.

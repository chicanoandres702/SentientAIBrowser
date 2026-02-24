---
description: An efficient workflow for reviewing local changes and creating a detailed Pull Request.
---

# Efficient GitHub PR Workflow

This workflow structures the PR process to ensure it provides maximum context to reviewers.

1. Ensure all changes are committed and pushed (see `git_commit` workflow).
2. Generate a comprehensive summary of the changes by analyzing the Git diff.
3. Structure the PR description as follows:
   - **What**: Concise description of changes.
   - **Why**: The problem being solved (referencing design intent, not syntax).
   - **How**: High-level technical overview of the implementation.
   - **Testing**: Steps to verify the changes work as intended.
4. Use GitHub CLI (`gh pr create`) or provide the structured markdown explicitly to the user so they can paste it into the GitHub UI.

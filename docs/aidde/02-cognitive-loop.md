# Component: AI Cognitive Loop

The 4-stage "brain" executed for every user prompt.

## Stage 1: Project Mapper
1. Parse prompt → Feature (Milestone), Task (Issue), Subtasks
2. Delegate to `git-orchestrator`: provision missing hierarchy via `gh` CLI
3. Confirm execution branch is checked out
4. **Disambiguation rule**: if prompt maps to >1 Milestone/Issue → halt and ask

## Stage 2: Contract Import
1. Delegate to `type-enforcer`: validate or create required models
2. Import from centralized models directory before writing any logic
3. Confirm all upstream/downstream data shapes are defined

## Stage 3: Code Generation
1. Enforce `src/features/<feature>/` structure (vertical slices)
2. Delegate to `complexity-guard` if any file risks exceeding 100 lines
3. Inject trace header in every generated file:
   ```
   /*
    * [Parent Feature/Milestone] <name>
    * [Child Task/Issue] #<number>
    * [Subtask] <description>
    * [Upstream] <source> -> [Downstream] <destination>
    * [Law Check] <lines> lines | Passed Do It Check
    */
   ```
4. Execute subtasks sequentially; check off Issue checklist after each

## Stage 4: The AIDDE Quad
No commit is valid until all four pass:

| Step | Agent | Action |
|------|-------|--------|
| **Trace** | git-orchestrator | Commit message has `Resolves: #ID` + Milestone reference |
| **Wire** | (orchestrator) | All imports resolve; no dead exports or ghost code |
| **Test** | test-validator | Unit tests created and passing for this subtask |
| **Verify** | security-auditor | All 8 CI/CD Gates pass |

## One Task Per Turn
If a prompt implies multiple Tasks, split them into separate Issues.
Present the split to the user and confirm before executing any.

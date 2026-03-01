# Pro Pilot Prompt Library
# Version: 2.2.0 — AIDDE v2 Edition

## Mission 1: Diagnostic Medic (Auto-Fixer)
**Slash:** `/medic_debug` | **Agent:** `medic-debug`
> Analyze the error. Perform Recursive Debugging — ask "Why?" 3 times to find the design
> flaw, not the syntax error. Apply fix. If fix pushes file over 100 lines, propose a split.

## Mission 2: Instruction Refresh (Anti-Drift)
**Slash:** `/pilot_refresh` | **Agent:** `context-manager`
> STOP. Re-read copilot-instructions.md. Confirm: 100-Line Law, Type Safety, AIDDE Quad,
> Feature Architecture. Acknowledge with "Systems Online." Report session state.

## Mission 3: Architectural Shrink (Refactoring)
**Slash:** `/enforce_100_lines` | **Agent:** `complexity-guard`
> Analyze the file. Identify distinct responsibilities. Refactor into:
> `*.controller.ts` (Orchestration), `*.service.ts` (Logic), `*.types.ts` (Interfaces).

## Mission 4: Feature Genesis
**Slash:** `/scaffold_feature` | **Agent:** `aidde` (orchestrator)
> Plan the file structure first. Register in module index. Create `src/features/{name}/`.
> Controller < 100 lines. Delegate type creation to `type-enforcer`.

## Mission 5: Debug Orchestrator
**Slash:** `/medic_debug` with launch.json flag
> Verify `.vscode/launch.json` exists. Insert logpoints at all public interface boundaries
> and state mutations. Identify entry/exit points of Controllers.

## Mission 6: Context Cartographer
> Analyze the file. Add navigation tags: `// @CORE`, `// @API`, `// @STATE`.
> Generate a Markdown outline of the class hierarchy and dependencies.

## Mission 7: Unit Test Generator
**Slash:** (auto-triggered by AIDDE Quad) | **Agent:** `test-validator`
> Generate a comprehensive test suite. Cover happy path, edge cases, error handling.
> Mock all external dependencies. Tests must compile AND pass.

## Mission 8: Security Auditor
**Agent:** `security-auditor`
> Scan for OWASP Top 10. Check for injection risks, hardcoded secrets, unsafe data handling,
> weak authentication. Run Gate 8. Report issues by severity with specific fixes.

## Mission 9: Documentation Scribe
> Generate JSDoc/DocString for all public interfaces and methods. Include @param, @return,
> and usage examples. Tone: professional. Do not document private internals.

## Mission 10: Code Reviewer
> Act as a Senior Engineer. Review for code smells, cognitive complexity, SOLID adherence.
> Rate 1-10. List specific improvements. Flag any 100-Line Law violations.

## Mission 11: App Streamliner
**Slash:** `/enforce_100_lines`
> Scan for files exceeding 100 lines. Perform RCA to understand why the file grew.
> Propose modular split following Feature Architecture. Update module index after refactor.

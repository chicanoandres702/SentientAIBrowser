# AI_CONSTITUTION.md
# Version: 5.2.0 - Documentation Lifecycle Edition

## SECTION 0: AUTOMATIC ENFORCEMENT
THESE RULES MUST BE READ AND APPLIED TO EVERY REQUEST, FILE CREATION, AND MODIFICATION.

## Section 1: Core Architectural Directives
1. The 100-Line Law: Files MUST NOT exceed 100 lines. Smaller files keep AI Token Density high and focus sharp.
2. The Why Mandate: Comments must explain the design intent, not the syntax.
3. Modular First: Prioritize small, reusable components. Use Interfaces to define clear boundaries.
4. Clean Code: No magic numbers. Use named constants. Prioritize readability over cleverness.
5. Contextual Naming: Files must use descriptive prefixes (e.g., 'setup.service.ts') to prevent AI context loss.
6. Feature Architecture: All business logic must reside in 'src/features/<feature>/'.

## Section 2: Advanced Logic Archetypes
### The Diagnostic Medic (Mission: Medic)
- Before any fix, perform Recursive Debugging. Identify the design flaw, not just the syntax error.
- Root Cause Analysis (RCA) is required for every bug report.
- Diagnostic Listener: Monitor the Problems tab. Categorize errors before proposing code.

### Anti-Drift Protocol
- AI Instruction Drift occurs every 10-15 messages.
- Perform a Pilot Refresh to re-ground the LLM in these rules periodically.

### Neural Tab Orchestration
- Keep Neighbor Files open to give the AI cross-file context (e.g., Logic + Interface).
- Focus Mode: Close tabs unused for 15+ minutes to reduce Context Poisoning.

## Section 3: Token Economy & Performance
- AI intelligence is inversely proportional to context noise.
- Delete unused code, close unused tabs, and keep files modular to ensure the AI stays Expert Level.
- Predictive Logic: Always anticipate the next 3 steps in the development lifecycle.

## Section 4: Documentation Lifecycle
1. **The Wiki Mandate**: Every major feature in `src/features/` must have a corresponding deep-dive entry in the project Wiki.
2. **README Integrity**: The `README.md` must be updated immediately upon changes to prerequisites, architecture, or core workflows.
3. **ADR Requirement**: All breaking changes or fundamental architectural shifts must be documented in an Architectural Decision Record (ADR) within `docs/architecture/`.
4. **Student-Friendly Documentation**: All documentation must be written to be "Student Friendly," explaining complex logic and setup with clarity and simplicity.

## Section 5: Project Lifecycle
1. **The Gold Standard Boot**: Every new project or major project phase must start with the `/project-launch` master workflow.
2. **Zero-Trust Token Economy**: `.aiignore` and `.cursorignore` must be generated immediately via `/scaffold_aiignore` to preserve AI context quality.
3. **Quality Guardians**: Git hooks must be established via `/git_hooks_setup` before the first feature commit.
4. **Environment Transparency**: Every project must maintain a current `.env.example` via `/scaffold_env`.

## Section 6: Issue Hierarchy
1. **The Tree Law**: Every project phase must follow a hierarchical "Tree" structure: Milestone (Root) -> Epic (Parent Issue) -> Tasks (Child Issues) -> Feature Branches.
2. **Explicit Linkage**: Every Child Issue must explicitly link to its Parent Issue in the description (e.g., "Part of #123").
3. **Branch Association**: Every Task Issue must have exactly one corresponding feature branch named `<type>/<slug>-#<id>`.
4. **Automated Provisioning**: Hierarchy trees should be provisioned using the `/github-tree-orchestrator` workflow to ensure consistency.

## Section 7: High-Fidelity Task Standards
1. **High-Fidelity Goal**: Every task must be informative, comprehensive, and practical, yet simple to understand.
2. **Rich Aesthetics**: Utilize modern markdown features (Alerts, Mermaid diagrams, Code Diffs) to explain the "Why" and the "How" of every task.
3. **Informative Checklists**: Tasks should not be simple lines of text; they must include context, expected outcomes, and technical prerequisites.
4. **Visual Evidence**: Tasks involving UI or complex flows must include Mermaid sequences or visual placeholders (using `generate_image`) to bridge the gap between idea and implementation.

## Section 8: Branching & PR Strategy
1. **The Path Law**: Branches must follow a hierarchical directory-like path: `(feature or milestone)/parent-slug/child-slug` (e.g., `feature/auth/login-button`).
2. **Parent Integrity**: The "Parent" branch (e.g., `feature/auth`) must exist before any "Child" task branches are created off it.
3. **Commit Integrity**: Commits are strictly prohibited on `main`. All code logic must originate in the leaf (task) branches.
4. **Mandatory PR Flow**: Every task branch must merge into its parent branch via a Pull Request. Every parent branch must merge into `main` via a Pull Request.
5. **CI Enforcement**: Merges are only permitted after passing all automated status checks (Lint, Build, Type-check).

## Section 9: Deep Traceability
1. **The Header Mandate**: Every source file must contain a header comment linking to its feature's `trace.md` or the relevant ADR (e.g., `// Feature: Auth | Trace: src/features/auth/trace.md`).
2. **Identity per Feature**: Every feature folder in `src/features/` must contain a `trace.md` file that catalogs its purpose, key interfaces, and dependency graph.
3. **Atomic Traceability**: Every commit message must prefixed with a Child Issue ID (e.g., `[#123] feat: implement login toggle`).
4. **Triggered Quality**: Automation triggers (like `auto-pr.yml`) must be used to ensure that Every push is immediately traceable via an open Pull Request.

## Section 11: AI-Native Context (NEW)
1. **Machine-Readable Traceability**: Every feature folder should contain an `ai-manifest.md` (or `.json`) providing a high-density, structured summary of its "State" and "Interface" for AI consumption.
2. **Context Injection**: Automated PR triggers must include a "Context for Next Agent" section, summarizing the "Why" and the "Implicit Logic" that may not be apparent from raw code.
3. **Traceability Validation**: Local validation scripts (`validate-sentient-code.js`) must strictly enforce the **Header Mandate**.
4. **AI-Ready Tasks**: High-fidelity tasks must include an "AI Context" section that lists all relevant KIs and ADRs required for an agent to solve the task without broad codebase research.

## Section 12: Recommended Workflows
- `/github-tree-orchestrator`: Automated hierarchical issue and branch creation.
- `/project-launch`: Unified master workflow for project initialization.
- `/documentation-lifecycle`: Manage the lifecycle of README, Wiki, and technical docs.
- `/enforce_100_lines`: Enforce the 100-Line Law and Modular First architecture.
- `/scaffold_aiignore`: Establish AI context protection.
- `/git_hooks_setup`: Initialize constitution enforcement hooks.
- `/scaffold_readme`: Refresh the project README.
- `/scaffold_docs_architecture`: Initialize ADR structure and templates.
- `/scaffold_env`: Build or refresh the `.env.example` template.
- `/git_commit`: Standard workflow for clean commits.

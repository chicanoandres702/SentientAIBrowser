---
description: Generates a standard Architecture Decision Records (ADR) structure and a "Why Mandate" template.
---

# Scaffold Docs Architecture Workflow

This workflow addresses the "Why Mandate" and "Student Friendly" directives by establishing a physical record of architectural decisions over time.

1. Ensure the directory `docs/architecture/` exists in the project root.
2. Inside the folder, create an `index.md` explaining the purpose of Architectural Decision Records.
3. Automatically generate a sample `0001-record-architecture-decisions.md` ADR detailing that the team is following the `AI_CONSTITUTION.md`.
4. Create a `.templates/adr-template.md` file designed with the sections:
   - **Context**: What is the problem being solved?
   - **Decision**: What was the technical choice?
   - **Consequences**: What were the trade-offs?

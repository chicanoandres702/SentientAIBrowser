---
description: Comprehensive workflow for managing README, Wiki, and Project Documentation.
---

# Documentation Lifecycle Workflow

This workflow ensures that the project's documentation remains as high-quality and state-of-the-art as its code, adhering to the "Why Mandate" and "Student Friendly" directives.

## 1. README Maintenance
The `README.md` is the front door of the project.
- **Rule**: Update `README.md` immediately when adding new prerequisites, installation steps, or changing project architecture.
- **Action**: Use `/scaffold_readme` to refresh the structure if it becomes outdated.
- **Section Integrity**: Ensure "Why Mandate" and "Architecture" sections are always current.

## 2. Wiki Management
The Wiki stores feature-level deep dives and long-form knowledge.
- **Action**: Create a new Wiki page for every major feature in `src/features/`.
- **Content**:
    - High-level goal of the feature.
    - Component breakdown.
    - Integration touchpoints.
    - Future roadmap for the feature.
- **Tooling**: Use `generate_image` or `mermaid-expert` to create diagrams for Wiki pages.

## 3. Documentation & ADRs
Technical documentation for developers.
- **Rule**: Every breaking change or major design decision MUST have an ADR.
- **Action**: Use `/scaffold_docs_architecture` to initialize the `docs/architecture/` folder if missing.
- **Process**:
    - Record context, decision, and consequences.
    - Link ADRs in corresponding Pull Requests.

## 4. Rulings Enforcement
- Proactively check if documentation is required before finishing a task.
- If a task involves a new feature, a Wiki update is mandatory.
- If a task changes the build process (like the recent Firebase fixes), the README prerequisites must be updated.

---
description: Enforce the 100-Line Law and Modular First architecture per Section 1 of AI Constitution
---

# Enforce 100-Line Law Workflow

This workflow executes the core architectural directives to keep AI Token Density high and maintain focus.

1. **Assess File Size**
   - Identify any files exceeding 100 lines.
2. **Apply Modular First Principle**
   - Break down the large file into smaller, reusable components.
   - Extract interfaces or types to clear boundary files (e.g., `feature.types.ts`).
3. **Refactor and Rename**
   - Ensure new files use descriptive prefixes (e.g., `feature.service.ts`, `feature.utils.ts`) to prevent AI context loss.
   - Verify all business logic is located within `src/features/<feature>/`.
4. **Review Contextual Rules**
   - Ensure there are no magic numbers (extract to constants).
   - Check that comments explain *why* (design intent), not *what* (syntax).

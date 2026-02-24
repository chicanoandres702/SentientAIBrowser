---
description: Perform a Root Cause Analysis (RCA) and recursive debugging for any bug per Section 2 of AI Constitution
---

# The Diagnostic Medic Workflow

This workflow executes the **Diagnostic Medic (Mission: Medic)** protocol from the AI_CONSTITUTION.

1. **Analyze the Issue deeply**
   - Do not jump straight to a syntax fix.
   - Perform Recursive Debugging to identify if the issue stems from a design flaw or structural problem.
2. **Review the Diagnostic Listener**
   - Check the Problems tab or run linters/type checkers to categorize errors before proposing code.
3. **Conduct Root Cause Analysis (RCA)**
   - Draft a brief RCA explaining *why* the bug occurred and how the proposed architectural fix prevents it.
4. **Iterate and Resolve**
   - Implement the fix using small, reusable components (Modular First).
   - Verify that the fix does not violate the 100-Line Law.

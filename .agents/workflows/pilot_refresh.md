---
description: Re-ground the AI in the Core Directives to prevent instruction drift
---

# Pilot Refresh Workflow

This workflow combats AI Instruction Drift, which typically occurs every 10-15 messages.

1. **Review Rules**
   - Re-read the `~/.geminirules` or `.geminirules` file in the current workspace.
2. **Assess Current Context**
   - Check if recent files or responses have drifted from the 100-Line Law.
   - Verify if "magic numbers" or poor naming conventions have crept into the latest code.
3. **Restate Alignment**
   - Acknowledge the core directives (e.g., Modular First, Clean Code, Language-Specific Standards).
   - Close any unused tabs or clear irrelevant context (Focus Mode).
4. **Resume Task**
   - Continue with the user's request with refreshed adherence to the AI_CONSTITUTION.

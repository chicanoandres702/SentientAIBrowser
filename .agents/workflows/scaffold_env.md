---
description: Generates a standard environment and secrets template.
---

# Scaffold Env Workflow

This workflow automatically creates `.env.example` templates based on the codebase to give AI clean context without exposing secrets.

1. Ensure `.env` is listed in your `.gitignore` and `.aiignore`.
2. Scan the repository for `process.env.*` or `os.environ` usage.
3. Automatically build an `.env.example` file populated with all discovered variables.
4. Add descriptive "Why" comments next to each variable to explain its domain context.

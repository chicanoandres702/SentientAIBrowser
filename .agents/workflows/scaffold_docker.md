---
description: Scaffolds a production-ready Container architecture for the active project.
---

# Scaffold Docker Workflow

This workflow uses AI to analyze your application and write clean, multi-stage Docker configurations.

1. Generate a `.dockerignore` based heavily off the `.aiignore` file (ignoring `node_modules`, `dist`, `.env` etc.).
2. Write a `Dockerfile` utilizing a slim operating system image as a base (e.g., `node:18-alpine`).
3. Implement a Multi-Stage Build:
   - Stage 1: Dependency installation & compiling.
   - Stage 2: Production runtime image (only copies necessary compiled artifacts to dramatically reduce final image size).
4. Optionally generate a `docker-compose.yml` for local orchestration if external dependencies (like Postgres or Redis) are detected.

---
description: Automatically initialize a new repository, stage the initial architecture, and push to GitHub.
---

# Repository Initialization Workflow

This workflow sets up a project from scratch to ensure it tracks correctly and adheres to the Constitution immediately.

// turbo-all
1. `git init`
2. Create standard `.gitignore` based on the tech stack (e.g., node, python, dotnet).
3. Ensure `.geminirules` (or symlink) is present in the project root.
4. `git add .`
5. `git commit -m "chore: initial commit aligned with AI Constitution"`
6. `git branch -M main`
7. If the user provides a GitHub repo URL, run `git remote add origin <URL>`.
8. `git push -u origin main`

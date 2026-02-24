---
description: Set up a GitHub Actions workflow to automatically build and release upon a new version tag.
---

# CI/CD Runner Setup Workflow

This workflow quickly lays down an automated pipeline so code that is pushed or tagged immediately gets built and prepped for release.

1. Ensure the directory `.github/workflows/` exists.
2. Create `.github/workflows/release.yml`.
3. Scaffold a YAML pipeline that:
   - **Triggers**: On push to `main` branch, or on pushing a `v*` tag.
   - **Environment Setup**: Checks out code and installs the language-specific environment (e.g., Node, Python Setup).
   - **Verification**: Runs the `lint` and `test` commands to ensure the 100-Line Law and tests pass on the CI server.
   - **Build**: Compiles the application or bundles the asset.
   - **Release**: Uses `softprops/action-gh-release` (or similar native GitHub runner action) to attach the build artifacts to a GitHub Release automatically when tagged.
4. Instruct the user to commit this `.github/` folder using the `git_commit` workflow.

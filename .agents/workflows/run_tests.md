---
description: An efficient workflow to run unit tests and ensure code stability.
---

# Run Tests Workflow

This workflow is used during the "Verify" step to test logical boundaries and pure utils functions.

// turbo-all
1. Run the test suite for the current component or feature module (e.g., `npm run test -- <feature_name>`, `pytest -k <feature_name>`).
2. If tests pass, verify code coverage using `npm run coverage` or `pytest --cov`.
3. If tests fail, do NOT immediately change application code.
4. Perform the `Diagnostic Medic (Mission: Medic)` protocol locally on the specific failing test to assess if the test is flawed or the implementation is flawed.

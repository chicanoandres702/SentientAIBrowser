# Component: AI Safety Protocols

Rules that prevent hallucination, data loss, and security failures.

## 1. Disambiguation Protocol
If a prompt maps to more than one possible Milestone or Issue:
**HALT. Ask before provisioning anything.**
> "Did you mean Feature A (Milestone #2) or Feature B (Milestone #5)?"
Never infer silently. Wrong provisioning creates permanent orphans.

## 2. Idempotency Rule
Always GET before POST.
Never create duplicate milestones or issues.
If it exists, reuse it.

## 3. One Task Per Turn
Each turn handles exactly ONE Child Issue.
If a prompt implies multiple tasks:
1. Split into separate Issues
2. Present the list to the user
3. Confirm before executing any

## 4. No Silent Assumptions
If any required field is unknown (assignee, label, upstream, downstream):
Surface it as a **blocking question**.
Hallucinated wiring is worse than incomplete wiring.

## 5. Rollback Protocol
If any CI/CD Gate fails after a commit:
- Do NOT force-push or amend history
- Open a new Subtask: `fix: resolve <Gate N> failure`
- Re-run the full AIDDE Quad before re-submitting the PR

## 6. Stale Branch Policy
Any `feature/*` branch with no commits for 14+ days:
- Flag during Boot Sync
- Comment on linked Issue asking disposition
- Options: continue | close | reassign
- Never touch without user confirmation

## 7. Context Window Budget
- Max 5 files loaded per task execution
- If more needed → feature slice must be refactored (vertical slice violation)
- Run `/pilot_refresh` every 10 messages to prevent instruction drift

## 8. Credential Hygiene (Zero Trust)
- Credentials ONLY from environment variables
- Never hardcoded, never logged, never in commits or Issue bodies
- `.env` files must be in `.gitignore`
- GitHub Actions must use `${{ secrets.KEY }}` syntax

## 9. Conflict Resolution
On merge conflict (stash pop or PR merge):
- Never auto-resolve
- Create `conflict/{branch}` with conflict markers intact
- Open a new Child Issue tagged `needs-human-review`
- HALT until human resolves

## 10. Contract Change Warning
Modifying any model/types file:
1. Output diff preview
2. List all importing files
3. Require explicit user confirmation
4. Only then update all consumers atomically

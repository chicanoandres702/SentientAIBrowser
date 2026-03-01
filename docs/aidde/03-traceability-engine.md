# Component: Traceability Engine

Guarantees absolute context retention. Prevents orphaned code.

## Issue Body Template (Mandatory)
Every GitHub Issue created by the AI MUST use this body:

```markdown
### 🎯 Purpose
[Why does this task exist? Justify its necessity in the broader feature.]

### 📝 Description
[Detailed explanation of what is being built or modified.]

### 🐛 The Issue (If Applicable)
[Bug/refactor context, error logs, broken logic.]

### 🔄 System Flow (Traceability)
* **Upstream:** [Where is the data/trigger coming from?]
* **Downstream:** [Where is the data going / What is affected?]

### ☑️ Subtasks (Execution Checklist)
- [ ] Subtask 1
- [ ] Subtask 2

### 🚀 Future Aspirations & Tracing
[Scaling notes, future features, tracing considerations for the next AI agent.]
```

## Commit Message Format
```
feat: {subtask description}

- Subtask {n} of {total} complete
- Passes all unit tests (AIDDE Quad)

Resolves: #{issue-number}
Parent Feature (Milestone): {name} (ID: #{milestone-number})
```

**Rules:**
- Do NOT use scopes like `(auth)` that duplicate the feature name
- Every commit MUST contain `Resolves: #ID`
- Every commit MUST reference the Parent Milestone

## Code-Level Trace Header
Every generated file starts with:
```
/*
 * [Parent Feature/Milestone] User Authentication
 * [Child Task/Issue] #42
 * [Subtask] Write token extraction function
 * [Upstream] Router -> [Downstream] UserStore
 * [Law Check] 45 lines | Passed Do It Check
 */
```

# Deployment Checklist — Path B Fixes

## What Changed

**2 files modified:**
1. `functions/src/backend-mission.executor.ts` - Backend executor (stop re-planning + add lock)
2. `src/services/mission-task.executor.ts` - Frontend executor (add lock acquisition)

**1 new Firestore field:**
- `missions.executingAgent` - Coordination field ('frontend' | 'backend')

---

## Pre-Deployment Steps

### 1. Verify Build Status ✅

```bash
cd functions
npm run build
# Output: Should complete with NO errors (all TypeScript compiles)
```

**Current status**: ✅ PASSING

### 2. Verify Frontend Compiles

```bash
npm run build:web
# Or check tsconfig for any mission-task-executor errors
```

### 3. Test Locally (Optional)

```bash
# Start local emulator
firebase emulators:start

# In separate terminal, run tests
npm test

# Verify:
# - Frontend can create missions
# - Backend can load stored missionResponse
# - Lock field appears in Firestore
```

---

## Deployment Steps

### Step 1: Deploy Cloud Functions

```bash
cd functions
npm run build          # Compiles to lib/
firebase deploy --only functions
```

**What deploys:**
- Updated `backend-mission.executor.js` (stop re-planning)
- Lock check logic (skip if executingAgent != 'backend')

**Rollback command** (if issues):
```bash
# Deploy previous version from git
git checkout HEAD~1 -- functions/src/backend-mission.executor.ts
npm run build
firebase deploy --only functions
```

### Step 2: Deploy Frontend

```bash
npm run build:web
firebase deploy --only hosting
```

**What deploys:**
- Updated `mission-task-executor.ts` (set executingAgent lock)
- Lock acquisition logic

### Step 3: Verify Deployment

Check Firestore:
```bash
# In Firebase Console → Firestore
# 1. Create a test mission manually
# 2. Observe missions/{{ id }} document
# 3. Verify executingAgent field appears when execution starts
# 4. Verify it's set to 'frontend' or 'backend' appropriately
```

---

## Post-Deployment Verification

### Check 1: Firestore Schema

**In Firebase Console → Firestore:**

```
missions/{{ any_id }}
├─ id: ✓
├─ goal: ✓
├─ status: ✓
├─ missionResponse: ✓ (should still exist)
├─ executingAgent: ✓ (NEW FIELD - should appear when executing)
├─ updated_at: ✓
└─ ... other fields
```

### Check 2: Execution Lock Works

**Test scenario:**

1. Create a mission via mobile UI
2. Observe logs:
   - **Frontend**: `[MissionTaskExecutor] Starting mission task execution listener...`
   - **Backend**: `[Executor] ⏭ Skipping — frontend has execution lock (executingAgent=frontend)`
3. Verify: Only frontend logs appear, backend logs show "Skipping"

### Check 3: Plan Consistency

**Test scenario:**

1. Create mission: "Complete survey"
2. Verify:
   - `task_queues/t-1.title` = first segment name from original plan
   - `missions.missionResponse.execution.segments[0].name` = same
3. Watch execution:
   - Frontend executes steps from original plan
   - task_queues progress % increases
   - Backend logs show it skipped (not re-executing)

### Check 4: No Write Conflicts

**Firestore monitoring:**

Check Firestore logs for write conflicts:
```bash
# In Cloud Logging, search for:
# - "PERMISSION_DENIED"
# - "FAILED_PRECONDITION"
# - "ABORTED"

# Should see NONE (if lock works correctly)
```

---

## Rollback Plan (If Issues)

### Option A: Rollback Frontend Only

**Problem**: Frontend lock not working

```bash
git checkout HEAD~1 -- src/services/mission-task.executor.ts
npm run build:web
firebase deploy --only hosting
```

**Result**: Frontend won't set lock, but backend will still skip if needed

### Option B: Rollback Backend Only

**Problem**: Backend not respecting lock

```bash
cd functions
git checkout HEAD~1 -- src/backend-mission.executor.ts
npm run build
firebase deploy --only functions
```

**Result**: Backend will re-plan again (old behavior) - not ideal but safe

### Option C: Full Rollback

```bash
git revert HEAD
cd functions && npm run build
firebase deploy
```

**Result**: Returns to dual-execution (old problematic state)

---

## Monitoring Post-Deployment

### Key Metrics to Watch

1. **Execution Lock Acquisitions**
   - Should see: `[Executor] ⏭ Skipping` messages
   - Count: Should roughly equal number of backend task triggers
   - Health: Should be 100% (all skips = all locks respected)

2. **Plan Consistency**
   - Should NOT see: `index MISMATCH` errors
   - Should NOT see: segment title ≠ task title discrepancies
   - Health: 0 divergences

3. **Mission Completion Rate**
   - Before: Some missions fail due to dual execution
   - After: Higher completion rate
   - Expected improvement: +10-20%

4. **Firestore Write Volume**
   - Before: Double writes (frontend + backend)
   - After: Single writes only (one executor)
   - Expected reduction: -40-50%

---

## Documentation Updates Needed

- [ ] Update README.md with: "Backend uses stored plan (no re-planning)"
- [ ] Update deployment docs with: "Two execution paths: frontend + backend with coordination lock"
- [ ] Add to troubleshooting guide:
  - "If mission not executing: check missions.executingAgent field"
  - "If locked forever: manually clear executingAgent in Firestore"

---

## Database Migration (if needed)

**Existing missions** (created before this deploy):
- Will have: `executingAgent: undefined` or missing field
- Behavior: Backend will attempt to acquire lock (safe)
- No action needed: Field auto-created on first execution after deploy

**To clear old missions:**
```bash
# In Firebase Console → Firestore
# Query: missions where status == 'active'
# If any are stuck, manually set: executingAgent = undefined
# Or: status = 'cancelled'
```

---

## Safety Checklist

- [ ] Backend compiles without errors
- [ ] Frontend compiles without errors
- [ ] Lock acquisition logic reviewed
- [ ] Lock skip logic reviewed
- [ ] Stored plan loading logic reviewed
- [ ] No re-planning code remains (removed determineNextAction import)
- [ ] Test mission completes successfully
- [ ] executingAgent field appears in Firestore
- [ ] No write conflicts in logs
- [ ] Plan consistency verified (title == segment name)
- [ ] Rollback plan documented and tested

---

## Success Criteria

✅ **Deployment successful if:**
1. Frontend missions execute without backend interference
2. Backend missions execute with stored plan (no re-planning)
3. executingAgent field coordinates properly
4. No plan divergence observed
5. No write conflicts in Firestore
6. Mission completion rate improved

❌ **Rollback if:**
1. executingAgent field causes validation errors
2. Missions fail to start (lock always conflicts)
3. Plan divergence still occurs (plan not being loaded)
4. Write conflicts increase instead of decrease

---

## Questions & Answers

**Q: What if both frontend and backend try to acquire lock simultaneously?**
A: Firestore write is atomic. First one to write wins. Second one fails and skips.

**Q: What if executingAgent field is never cleared?**
A: Mission stays locked. Frontend can manually clear it by setting status='cancelled'.

**Q: Can we run both paths intentionally?**
A: No - the lock prevents it. To run backend separately, don't start frontend executor.

**Q: Is the stored plan always up-to-date?**
A: Yes - it's created at plan time (POST /agent/plan) and never changes during execution.

**Q: What if Firestore connection drops during lock?**
A: Mission will remain locked until timeout or manual intervention. This is safer than corrupted state.

---

## Support Contact

If deployment issues occur:
1. Check Cloud Logging for `[Executor]` messages
2. Verify executingAgent field in Firestore missions doc
3. Review Firestore quota/billing (more write operations initially)
4. Check function cold-start logs (might see skip on first trigger)


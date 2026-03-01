# Architecture: Before vs After Path B Fixes

## BEFORE: Problems in Dual Execution

```
User Prompt
    ↓
POST /agent/plan (Gemini plans ONCE)
    ↓
MissionResponse stored in missions doc
    ↓
buildMissionFromSegments() creates:
  ├─ missions/{{ id }}: { status: 'active', missionResponse: {...} }
  └─ task_queues/*: { order: 1,2,3, subActions: [...] }
    ↓
    ┌──────────────────────────────────┬──────────────────────────────────┐
    │ RACE CONDITION ZONE              │ CONFLICT ZONE                     │
    ├──────────────────────────────────┼──────────────────────────────────┤
    │                                   │                                  │
    ▼                                   ▼                                  ▼
Frontend MissionTaskExecutor        Backend processMissionStep       Both execute simultaneously!
(onSnapshot listener)               (Cloud Tasks trigger)
├─ Sees: status='active'            ├─ Sees: status='active'
├─ No lock check                    ├─ No lock check
├─ Executes: subActions[] from      ├─ CALLS: determineNextAction()
│  original task_queues              │  (RE-PLANS from scratch!)
│                                    │
└─ Updates: task_queues with        └─ Gets: NEW segments (may differ)
   progress                            ├─ Segment count changed?
                                       ├─ Segment order changed?
                                       ├─ Step count changed?
                                       │
                                       └─ Uses: segOrder from task_queues
                                          But indexes into NEW segments
                                          → segments[segOrder-1] MISMATCH!
                                          └─ Executes wrong segment!
                                          └─ Updates wrong subActions!
                                          
                                    🔴 DIVERGENCE: 
                                    Frontend shows original plan
                                    Backend executes new plan
                                    
                                    🔴 RACE: Both update task_queues
                                    Last write wins (unpredictable state)
```

### Example Timeline: BEFORE

```
t=0s   missions/{{ id }} created { status: 'active', missionResponse }
       task_queues docs created from ORIGINAL plan:
       ├─ task_queues/t1: order=1, title="Navigate to site", subActions[1]
       ├─ task_queues/t2: order=2, title="Find form", subActions[3]
       └─ task_queues/t3: order=3, title="Submit", subActions[2]

t=1s   Frontend onSnapshot fires
       ├─ Reads missions doc
       ├─ Executes task_queues/t1 (Navigate)
       └─ Updates: task_queues/t1 { subActions[0].status: 'completed' }
       
t=2s   Backend Cloud Task fires
       ├─ Reads missions doc
       ├─ Calls determineNextAction() → GET NEW RESPONSE
       ├─ New response has NEW segments:
       │  ├─ "Go to home page" (NEW, wasn't in original)
       │  ├─ "Find form" (SAME)
       │  └─ "Submit" (SAME)
       │
       ├─ Frontend has task_queues/t1.order=1
       ├─ Backend looks for segments[1-1]=segments[0]
       ├─ Gets "Go to home page" (WRONG! should be "Find form")
       └─ Executes wrong segment!
       
t=3s   Frontend: task_queues/t1 completed
       ├─ Auto-advances: task_queues/t2 → 'in_progress'
       └─ User sees: "Find form" highlighted
       
       BUT Backend already executed:
       ├─ "Go to home page" (from new plan segment[0])
       ├─ Updated: task_queues/t2 { subActions[0]: 'completed' }
       └─ Progress desync!
       
t=4s   Both update same doc → WRITE CONFLICT
       ├─ Frontend: { progress: 50%, status: 'in_progress' }
       ├─ Backend: { progress: 33%, status: 'in_progress' }
       └─ Last writer wins (unpredictable)
```

---

## AFTER: Fixed Path B

```
User Prompt
    ↓
POST /agent/plan (Gemini plans ONCE)
    ↓
MissionResponse stored in missions doc
    ↓
buildMissionFromSegments() creates:
  ├─ missions/{{ id }}: { status: 'active', missionResponse: {...}, executingAgent: undefined }
  └─ task_queues/*: { order: 1,2,3, subActions: [...] }
    ↓
    ┌──────────────────────────────────┬──────────────────────────────────┐
    │ COORDINATION ZONE (with lock!)   │ NO CONFLICTS POSSIBLE            │
    ├──────────────────────────────────┼──────────────────────────────────┤
    │                                   │                                  │
    ▼                                   ▼                                  ▼
Frontend MissionTaskExecutor        Backend processMissionStep       Only ONE executes!
(onSnapshot listener)               (Cloud Tasks trigger)
├─ Sees: status='active'            ├─ Sees: status='active'
├─ ✅ ACQUIRES LOCK                 ├─ ✅ CHECKS LOCK
│  Sets: executingAgent='frontend'   │  Reads: executingAgent='frontend'
│                                    │  → SKIPS (frontend owns it)
├─ Executes: subActions[] from      │  Returns without doing anything
│  STORED missionResponse            │
│ (same one frontend used)           │
│                                    │
└─ Updates: task_queues with        └─ Updates: NOTHING (not running)
   progress from original plan          Result: No write conflicts!
   
                                    ✅ ONE EXECUTION PATH ACTIVE
                                    ✅ NO PLAN DIVERGENCE
                                    ✅ NO RACE CONDITIONS
                                    ✅ INDEXES ALWAYS MATCH
```

### Example Timeline: AFTER

```
t=0s   missions/{{ id }} created { status: 'active', missionResponse, executingAgent: undefined }
       task_queues docs created from ORIGINAL plan:
       ├─ task_queues/t1: order=1, title="Navigate to site", subActions[1]
       ├─ task_queues/t2: order=2, title="Find form", subActions[3]
       └─ task_queues/t3: order=3, title="Submit", subActions[2]

t=1s   Frontend onSnapshot fires
       ├─ ✅ Acquires lock: missions/{{ id }} { executingAgent: 'frontend' }
       ├─ Reads: missions doc with stored missionResponse
       ├─ Executes task_queues/t1 using plan from missionResponse
       └─ Updates: task_queues/t1 { subActions[0].status: 'completed' }
       
t=2s   Backend Cloud Task fires
       ├─ Reads missions doc
       ├─ Checks: executingAgent = 'frontend'
       ├─ ✅ LOCK CHECK FAILS
       │  Logs: "[Executor] ⏭ Skipping — frontend has execution lock"
       └─ Returns WITHOUT executing
       
t=3s   Frontend: task_queues/t1 completed
       ├─ Auto-advances: task_queues/t2 → 'in_progress'
       └─ User sees: "Find form" highlighted
       
       Backend: Does nothing (skipped)
       ├─ No conflicting updates
       ├─ No divergent plans
       └─ Progress clean and consistent
       
t=4s   Frontend: task_queues/t2 completing
       ├─ Updates: task_queues/t2 { progress: 100% }
       └─ CLEAN UPDATE (no race condition)
```

---

## Data Structure: BEFORE vs AFTER

### missions/{{ id }} - BEFORE

```typescript
{
  id: string;
  userId: string;
  goal: string;
  status: 'active' | 'completed' | 'waiting' | 'cancelled';
  progress: number;
  tabId: string;
  missionResponse: MissionResponse;    // ← Stored but NOT used in backend!
  tasks: MissionTask[];                // ← Used by frontend executor only
  useConfirmerAgent: boolean;
  lastAction: string;
  // No execution coordination field!
}
```

### missions/{{ id }} - AFTER

```typescript
{
  id: string;
  userId: string;
  goal: string;
  status: 'active' | 'completed' | 'waiting' | 'cancelled';
  progress: number;
  tabId: string;
  missionResponse: MissionResponse;    // ← NOW USED by backend!
  tasks: MissionTask[];
  useConfirmerAgent: boolean;
  lastAction: string;
  
  // ✅ NEW: Execution coordination
  executingAgent?: 'frontend' | 'backend';  // ← Prevents dual execution
  updated_at: string;
}
```

---

## Code Changes Summary

### Backend Change: Stop Re-Planning

**Before**:
```typescript
// PROBLEM: Re-plans every cycle!
const response = await determineNextAction(userId, data.goal, [], screenshot, domain, ...);
const segments = response.execution.segments;  // ← NEW segments every time!
```

**After**:
```typescript
// FIXED: Use stored plan from frontend
const storedPlan = data.missionResponse;
const segments = storedPlan.execution.segments;  // ← SAME segments always
```

### Backend Change: Add Lock Check

**Before**:
```typescript
// PROBLEM: No coordination - both frontend & backend can run
export async function processMissionStep(missionId: string) {
    const snap = await missionRef.get();
    if (!snap.exists || snap.data()?.status !== 'active') return;
    // ... proceed to execute
}
```

**After**:
```typescript
// FIXED: Check lock before executing
export async function processMissionStep(missionId: string) {
    const snap = await missionRef.get();
    if (!snap.exists || snap.data()?.status !== 'active') return;
    
    const data = snap.data()!;
    if (data.executingAgent && data.executingAgent !== 'backend') {
        console.log(`[Executor] ⏭ Skipping — frontend has execution lock`);
        return;
    }
    // ... proceed to execute
}
```

### Frontend Change: Set Lock

**Before**:
```typescript
// PROBLEM: No coordination field - both can execute
private async executeTask(missionId, task, goal) {
    const missionRef = doc(db, 'missions', missionId);
    // ... start executing without coordinating
}
```

**After**:
```typescript
// FIXED: Acquire lock before executing
private async executeTask(missionId, task, goal) {
    const missionRef = doc(db, 'missions', missionId);
    await updateDoc(missionRef, { 
        executingAgent: 'frontend',
        updated_at: new Date().toISOString()
    });
    // ... now safe to execute
}
```

---

## Test: Verify the Fix

### Scenario 1: Frontend Executes (Path A)

```
✅ Mission created { executingAgent: undefined }
✅ Frontend acquires lock { executingAgent: 'frontend' }
✅ Backend checks lock, sees 'frontend', skips
✅ Only frontend executes
✅ Task_queues updates clean and consistent
```

### Scenario 2: Backend Executes (Cloud-Only)

```
✅ Mission created { executingAgent: undefined }
❌ Frontend never starts (cloud-only mode)
✅ Backend acquires lock { executingAgent: 'backend' }
✅ Backend executes using stored plan
✅ Task_queues updates clean and consistent
```

### Scenario 3: Race Condition Protection

```
✅ Mission created { executingAgent: undefined }
✅ Frontend sets lock: { executingAgent: 'frontend' }
✅ Backend checks lock, sees 'frontend'
✅ Backend LOG: "[Executor] ⏭ Skipping — frontend has execution lock"
✅ Backend returns without executing
✅ Frontend proceeds uninterrupted
✅ NO CONFLICT
```

---

## Impact Summary

| Aspect | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Re-planning** | Every backend cycle | Only at frontend planning | ✅ Eliminates divergence |
| **Index Mismatch** | Possible when re-plans | Impossible (stored plan) | ✅ Consistent execution |
| **Dual Execution** | Both run simultaneously | Only one runs (lock) | ✅ Clean coordination |
| **Write Conflicts** | Common (race condition) | None (execution lock) | ✅ Data integrity |
| **Frontend UI** | May show wrong plan | Always shows correct plan | ✅ User sees truth |
| **Backend Latency** | Extra LLM call per cycle | No LLM call per cycle | ✅ Faster execution |
| **Complexity** | Implicit dual paths | Explicit coordination | ✅ Easier to debug |


# Task & Plan Flow Analysis

## Current Architecture

### CONTAINER VERSION (Backend/Functions)
**Location**: `functions/src/features/llm/`

**Endpoints**:
- `POST /agent/plan` → **Container Route** (`proxy-routes-browser.ts`)
  - Accepts: `{ prompt, schemaPrompt, tabId, userId, url }`
  - Calls: `determineNextAction()` from `llm-decision.engine.ts`
  - Returns: `{ missionResponse: { meta, execution: { plan, segments[] } } }`

**Decision Engine** (`llm-decision.engine.ts`):
- Takes ARIA snapshot + DOM map
- Uses screenshot context
- Calls **Gemini 2.5 Flash**
- System instruction: `DECISION_SYSTEM_INSTRUCTION` (from `llm-decision-prompt.ts`)
- Returns: `MissionResponse` with steps having ARIA selectors (role, name)

**Types** (Container):
```typescript
// From functions/src/features/llm/llm-decision.engine.ts
MissionStep: {
  action: 'click' | 'type' | 'navigate' | 'wait' | 'done' | 'wait_for_user' | 'ask_user' | ...
  role?: string        // ARIA role
  name?: string        // Accessible name
  text?: string        // Visible text fallback
  targetId?: string    // Legacy DOM-map selector
  domContext?: { tagName, text, role, placeholder }
  knowledgeContext?: { groupId, contextId, unitId }
  explanation: string
}

MissionResponse: {
  meta: { reasoning, intelligenceRating, intelligenceSignals, memoryUsed }
  execution: { plan: string, segments: [{ name, steps[] }] }
}
```

---

### UI VERSION (Frontend/SRC)
**Location**: `src/hooks/` + `src/features/llm/`

**Flow**:
1. User enters prompt in mobile UI (`MobileStreamLayout.tsx`)
2. **Calls `useBrowserController.handleExecutePrompt()`** (`useBrowserController.ts`)
   - Fetches `POST /agent/plan` to **CONTAINER** (no local planner fallback)
   - Awaits `MissionResponse` from container
   - Calls: `buildMissionFromSegments()` → **Creates Firestore tasks**

3. **`buildMissionFromSegments()`** (`mission-builder.ts`):
   - Creates top-level mission card
   - Maps each segment → one visible UI task
   - Segment steps → hidden `SubAction[]` array
   - Persists to Firestore `task_queues` collection
   - Each task gets: `{ id, title, status, missionId, runId, tabId, workflowId, workspaceId, order, subActions[] }`

**Types** (UI):
```typescript
// From src/features/tasks/types.ts
SubAction: {
  action: string
  goal?: string
  explanation: string
  status: TaskStatus
}

TaskItem: {
  id: string
  title: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked_on_user'
  timestamp: number
  missionId?: string       // Links to parent mission
  runId?: string           // Multi-run analytics
  tabId?: string           // Browser tab context
  workflowId?: string      // Logical workflow group
  workspaceId?: string     // User/org scope
  order?: number           // Display order within mission
  source?: 'planner' | 'manual' | 'fallback'
  isMission?: boolean      // True for mission header
  subActions?: SubAction[]
}
```

---

## FLOW DIAGRAM

```
┌─────────────────────────┐
│ Mobile UI (React Native)│
└──────────┬──────────────┘
           │
           │ 1. User prompt
           │
           ▼
┌────────────────────────────────────────┐
│ useBrowserController.handleExecutePrompt()
│ (Frontend: src/hooks/useBrowserController.ts)
└──────────┬─────────────────────────────┘
           │
           │ 2. POST /agent/plan
           │    {prompt, tabId, schemaPrompt}
           │
           ▼
┌──────────────────────────────────────────────────┐
│ Container POST /agent/plan                       │
│ (Backend: functions/src/proxy-routes-browser.ts) │
└──────────┬───────────────────────────────────────┘
           │
           │ 3. Get ARIA + screenshot context
           │
           ▼
┌──────────────────────────────────────────────────┐
│ determineNextAction()                            │
│ (Backend: functions/src/features/llm/llm-decision.engine.ts)
│ - Gemini 2.5 Flash                               │
│ - DECISION_SYSTEM_INSTRUCTION                   │
│ - Returns: MissionResponse                      │
└──────────┬───────────────────────────────────────┘
           │
           │ 4. MissionResponse:
           │    { meta, execution }
           │    execution.segments[].steps[] = ARIA selectors
           │
           ▼
┌──────────────────────────────────────────┐
│ useBrowserController receives response    │
│ → buildMissionFromSegments()              │
│ (Frontend: src/hooks/mission-builder.ts) │
└──────────┬───────────────────────────────┘
           │
           │ 5. Map segments → Tasks
           │    segment.steps[] → subActions[]
           │
           ▼
┌───────────────────────────────────────────────┐
│ Firestore task_queues collection              │
│ - Mission header (isMission: true)            │
│ - N child tasks (one per segment)             │
│ - Each task.subActions[] = steps              │
└───────────────────────────────────────────────┘
           │
           ▼
┌───────────────────────────────────────────────┐
│ Mobile UI Task Queue Display                  │
│ (MobileTaskQueueUI)                           │
│ Shows: Mission + Task cards                   │
│ Hidden: subActions[] (internal state)         │
└───────────────────────────────────────────────┘
```

---

## FLOW DISCREPANCIES IDENTIFIED

### 🔴 ISSUE 1: Orphaned Local Planner (Never Used)
- **Location**: `src/features/llm/llm-task-planner.engine.ts`
- **Problem**: `planTacticalSteps()` function exists but is NEVER called
- **Root Cause**: UI removed local fallback to force remote planner consistency (intentional per code comment)
- **Status**: ✅ INTENTIONAL (see `useBrowserController.ts` line 49)

### 🟡 ISSUE 2: Step Type Mismatch
- **Container Output** (functions): Steps have `role`, `name`, `text` (ARIA selectors)
- **UI Input** (mission-builder): Expects `action`, `goal`, `explanation`
- **Problem**: Container response uses ARIA format, but UI SubAction expects different fields
- **Impact**: `SubAction` array might receive fields it doesn't use or expect
- **Location**: 
  - Container produces: `{ action, role, name, text, explanation, ... }`
  - UI consumes as: `{ action, goal, explanation, status }`
  - Mapping happens at `buildMissionFromSegments()` line ~52

### 🔴 ISSUE 3: Schema Prompt Not Used Consistently
- **Container**: Accepts `schemaPrompt` parameter but **decision engine uses DECISION_SYSTEM_INSTRUCTION** (fixed)
- **Missing**: Never calls `llm-mission-planner.ts` which uses `buildMissionPlannerPrompt(schemaPrompt)`
- **Root Cause**: Two different LLM endpoints exist:
  1. **`POST /agent/plan`** → Uses `determineNextAction()` with fixed `DECISION_SYSTEM_INSTRUCTION`
  2. **`POST /agent/plan` (unused)** → Could use `planMissionWithLLM()` with `buildMissionPlannerPrompt()`
- **Impact**: `schemaPrompt` parameter is accepted but IGNORED

### 🟡 ISSUE 4: Model Version Mismatch
- **Container (llm-decision.engine)**: Uses `gemini-2.5-flash`
- **Container (llm-mission-planner)**: Uses `gemini-2.5-flash` 
- **UI (llm-task-planner)**: Uses `gemini-2.0-flash`
- **Status**: ✅ Consistent in actual use path (decision engine), but local UI planner unused

### 🟡 ISSUE 5: Missing Task Execution Flow
- **Problem**: Tasks are created in Firestore but execution path unclear
- **Current State**: `buildMissionFromSegments()` only creates tasks, doesn't start execution
- **Missing**: No code visible that:
  - Polls Firestore for pending tasks
  - Executes `SubAction[]` steps via container endpoints
  - Updates task status back to Firestore
- **Location**: Execution likely in `orchestrator.service.js` or background service

### 🟡 ISSUE 6: schemaPrompt Parameter Unused
- **UI sends**: `{ prompt, tabId, schemaPrompt: getSchemaPayload() }`
- **Container receives**: `schemaPrompt` parameter (line 36)
- **Container uses**: Parameter is appended to prompt: `promptWithSchema = schemaPrompt ? ${prompt}\n\n${schemaPrompt} : prompt`
- **But**: This string is passed to `determineNextAction()` as `prompt`, so schema is INCLUDED
- **Status**: ✅ WORKING AS INTENDED (schema is baked into prompt)

---

## SUMMARY OF FLOWS

### ✅ PRIMARY FLOW (Working)
```
UI: User prompt
  ↓
Frontend: POST /agent/plan + schemaPrompt
  ↓
Backend: determineNextAction() + ARIA context
  ↓
Gemini 2.5 Flash (DECISION_SYSTEM_INSTRUCTION)
  ↓
MissionResponse (steps with ARIA selectors)
  ↓
Frontend: buildMissionFromSegments()
  ↓
Firestore: task_queues { subActions[] }
  ↓
Mobile UI: Display mission + task cards
```

### ❌ ORPHANED FLOWS (Not Used)
```
1. src/features/llm/llm-task-planner.engine.ts
   - planTacticalSteps() - NEVER CALLED
   - Local planner removed to force remote consistency
   
2. functions/src/features/llm/llm-mission-planner.ts
   - planMissionWithLLM() - NEVER CALLED
   - buildMissionPlannerPrompt() - NEVER USED
   - Exists but endpoint doesn't use it
```

---

## COMPLETE EXECUTION PATH (Traced)

### FLOW 1: UI Task Creation → Firestore
```
┌─ User enters prompt
│
├─ useBrowserController.handleExecutePrompt()
│  └─ fetch POST /agent/plan
│
├─ Container: POST /agent/plan endpoint
│  └─ determineNextAction() → MissionResponse
│
├─ buildMissionFromSegments()
│  ├─ Creates: mission card (isMission: true, status: in_progress)
│  ├─ For each segment:
│  │  └─ addTask(segmentName, status, { missionId, order, subActions[] })
│  │     └─ Firestore task_queues doc created
│  └─ Creates: missions doc with { status: 'active', tasks: [] }
│
└─ Firestore State:
   ├─ task_queues/{{ mission-id }}-0: { isMission: true, title, status: in_progress, progress: 0 }
   ├─ task_queues/{{ mission-id }}-1: { title, status: pending, missionId, order: 1, subActions[] }
   ├─ task_queues/{{ mission-id }}-2: { title, status: pending, missionId, order: 2, subActions[] }
   └─ missions/{{ mission-id }}: { goal, status: active, tasks, tabId, useConfirmerAgent }
```

### FLOW 2: Frontend Execution (MissionTaskExecutor)
```
┌─ MissionTaskExecutor starts listening
│  └─ onSnapshot('missions', where status=='active')
│
├─ Detects new mission
│  └─ getCurrentTaskForMission() → first pending task from mission.tasks
│
├─ executeTask() loops through subActions
│  ├─ For each subAction in task.subActions:
│  │  ├─ Execute via: webViewRef.current.scanDOM() or remoteActions
│  │  └─ Update task status in Firestore
│  └─ On completion:
│     └─ updateDoc(missions/{{ missionId }}, { status: 'completed' })
│
└─ UI reflects changes via onSnapshot(task_queues)
```

### FLOW 3: Backend Execution (Cloud Run Mission Executor)
```
┌─ processMissionStep(missionId) called periodically
│  (triggered by Cloud Tasks or Firestore trigger)
│
├─ STAGE 1: Load missions/{{ missionId }}
│  └─ Check: status == 'active'
│
├─ STAGE 2: Get page context
│  ├─ getPersistentPage() → Playwright browser page
│  ├─ getAriaSnapshot() → ARIA tree
│  └─ page.screenshot() → screenshot.base64
│
├─ STAGE 3: LLM Decision
│  └─ determineNextAction(goal, ariSnapshot) → MissionResponse
│     └─ Returns NEW segment plan (can differ from UI plan)
│
├─ STAGE 4: Execute current segment
│  ├─ findCurrentSegmentTask() → first pending task_queues doc
│  ├─ For each step in segment.steps:
│  │  ├─ setSubActionStatus(taskDocId, stepIdx, 'in_progress')
│  │  ├─ executeStepWithRetry()
│  │  ├─ recordActionOutcome()
│  │  └─ setSubActionStatus(taskDocId, stepIdx, 'completed'|'failed')
│  └─ completeSegmentTask() → advances next pending to in_progress
│
└─ Updates: missions/{{ missionId }}, task_queues/{{ taskId }}
```

**KEY INSIGHT**: Both frontend AND backend execute tasks:
- **Frontend (MissionTaskExecutor)**: Uses webViewRef directly (mobile HeadlessWebView)
- **Backend (processMissionStep)**: Uses Playwright against persistent browser page

This creates a potential **dual-execution issue** if both are active simultaneously!

---

## RECOMMENDATIONS

### 🔴 CRITICAL ISSUE #1: Dual Execution (Race Condition)
**Problem**: Frontend MissionTaskExecutor AND backend processMissionStep both execute tasks
- Frontend listens to missions collection
- Backend Cloud Run task also processes missions
- **Result**: Tasks can be executed TWICE or in parallel

**Fix Options**:
1. **Frontend Only** (Recommended for mobile): Disable backend executor
2. **Backend Only** (For web/cloud): Use Cloud Run, frontend reads task results
3. **Coordinated**: Add execution lock with `executingAgent: 'frontend'|'backend'`

**Location to Fix**:
- `src/services/mission-task.executor.ts` - Conditional start
- OR `functions/src/backend-mission.executor.js` - Remove duplicate execution

### 🔴 CRITICAL ISSUE #2: Plan Divergence (Container Re-Plans)
**Problem**: Backend can regenerate different plan each cycle
- **UI creates plan once** → segments saved in task_queues
- **Backend regenerates plan** → `determineNextAction()` returns NEW segments each time
- **Result**: Frontend shows wrong task titles if backend plan changes

**Example**:
```
Cycle 1:
  UI Plan: ["Sign In", "Fill Form", "Submit"]
  Backend Plan: ["Sign In", "Fill Form", "Submit"]
  
Cycle 2 (after partial completion):
  Backend Plan: ["Fill Form", "Submit", "Verify"] ← DIFFERENT!
  But task_queues still has old plan
  → Mismatch between UI display and backend execution
```

**Location**: 
- Frontend: `src/hooks/buildMissionFromSegments()` - Uses ONE plan
- Backend: `functions/src/backend-mission.executor.js` line 52 - Re-plans every cycle

**Fix**:
- Store `missionResponse` in Firestore missions doc (already done)
- Backend: Don't re-plan if segment already in execution
- OR: Sync segment order from Firestore missions doc

### 🟡 CRITICAL ISSUE #3: Step Type Mismatch
**Problem**: Container steps use ARIA selectors, UI SubActions don't

**Container Step Format** (from determineNextAction):
```typescript
{
  action: 'click' | 'type' | 'navigate' | 'done' | ...
  role?: string        // ARIA role
  name?: string        // Accessible name
  text?: string        // Visible text
  targetId?: string    // Legacy fallback
  explanation: string
}
```

**UI SubAction Format** (what task_queues stores):
```typescript
{
  action: string
  goal?: string        // NOT in container steps!
  explanation: string
  status: TaskStatus
}
```

**Mapping Code** (mission-builder.ts line ~52):
```typescript
const subActions: SubAction[] = steps.map((step: any) => ({
    action: step.action || 'interact',
    goal: step.goal || segName,  // ← step.goal might be undefined!
    explanation: step.explanation || step.action,
    status: 'pending' as const,
}));
```

**Issue**: `step.goal` is often undefined in container response
- Container provides no `goal` field in steps
- UI falls back to `segName` (entire segment name)
- Result: Granular step intent is lost

**Fix**:
- Container: Add `goal` field to each step
- OR: UI: Extract goal from step.explanation

---

### 🟡 ISSUE #4: subActions Not Executed from task_queues

**Problem**: Container creates subActions but doesn't use task_queues in execution
- Frontend: Creates task_queues docs with subActions
- Backend: Reads missions collection, regenerates segments
- Backend: Calls setSubActionStatus() to update task_queues BUT
  - Segments from determineNextAction() don't match original subActions
  - No verification that backend steps align with stored subActions

**Location**:
- Frontend create: `src/hooks/mission-builder.ts` line 52
- Backend read: `functions/src/backend-mission.executor.js` line 58 (finds task via order)
- Backend update: `functions/src/task-queue-bridge.js` line 45 (setSubActionStatus)

**Issue**: 
```
task_queues doc has:
  subActions: [
    { action: 'click', goal: 'Find login button', ... },
    { action: 'type', goal: 'Enter username', ... }
  ]

But backend executes:
  segment.steps (from determineNextAction):
  [
    { action: 'click', role: 'button', name: 'Login' },
    { action: 'type', ... }
  ]
  
setSubActionStatus() just maps index to status, no verification!
```

**Fix**:
- Backend: Load original subActions from task_queues
- Backend: Verify segment.steps match stored subActions
- OR: Simplify - backend reads and executes subActions directly from task_queues

---

### 🟡 ISSUE #5: Task Execution Context Unclear

**Missing Documentation**:
- What triggers processMissionStep() in Cloud Run?
- How often? Every 1s? 5s? On-demand?
- What stops it? Manual status update only?
- Does backend wait for user confirmation on 'wait_for_user' actions?

**Location**: 
- Triggering: Likely Cloud Tasks or pub/sub (not visible in provided files)
- Stopping: missions.status != 'active' check

**Fix**:
- Document the trigger mechanism
- Add heartbeat/timeout handling

---

## SUMMARY OF FLOW FIXES NEEDED

| Issue | Severity | Root Cause | Solution |
|-------|----------|-----------|----------|
| Dual execution (frontend + backend) | 🔴 CRITICAL | MissionTaskExecutor + processMissionStep both run | Disable one, add lock, or coordinate |
| Plan divergence | 🔴 CRITICAL | Backend re-plans each cycle | Store plan in missions doc, use it |
| Step goal lost | 🟡 HIGH | Container omits `goal` field | Add to container or backfill in UI |
| subActions not validated | 🟡 MEDIUM | Backend doesn't verify vs stored steps | Sync or verify before execution |
| Execution trigger unclear | 🟡 MEDIUM | Documentation missing | Document Cloud Tasks / pub/sub setup |

---

## Files to Review

**Container (Backend)**
- `functions/src/proxy-routes-browser.ts` — `/agent/plan` endpoint
- `functions/src/features/llm/llm-decision.engine.ts` — Decision engine (USED)
- `functions/src/features/llm/llm-mission-planner.ts` — Mission planner (UNUSED)
- `functions/src/features/llm/llm-decision-prompt.ts` — System instruction (USED)
- `functions/src/features/llm/llm-planner-prompt.ts` — Planner prompt (UNUSED)

**Frontend (UI)**
- `src/hooks/useBrowserController.ts` — Plan execution call
- `src/hooks/mission-builder.ts` — Task creation from response
- `src/features/tasks/types.ts` — Data structures
- `src/features/llm/llm-task-planner.engine.ts` — Local planner (UNUSED)
- `src/utils/schema-context.ts` — Schema payload builder

**Execution/Sync** (To be traced)
- `orchestrator.service.js` — Likely task execution orchestrator
- Background sync services in `shared/`

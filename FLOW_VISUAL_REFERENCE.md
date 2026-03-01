# Task & Plan Flow — Visual Reference

## Timeline: From Prompt to Execution

```
User Enters Prompt
    │
    ▼
┌─────────────────────────────────────────────────┐
│ PHASE 1: PLANNING (Frontend)                    │
│ Location: useBrowserController.ts               │
└─────────────────────────────────────────────────┘
    │
    ├─ POST /agent/plan {prompt, tabId, schemaPrompt}
    │
    ▼
┌─────────────────────────────────────────────────┐
│ PHASE 2: DECISION (Container)                   │
│ Location: proxy-routes-browser.ts               │
│           llm-decision.engine.ts                │
│ Model: Gemini 2.5 Flash                         │
│ Input: ARIA snapshot + screenshot               │
│ Output: MissionResponse with ARIA selectors     │
└─────────────────────────────────────────────────┘
    │
    │ Response: { meta, execution: { plan, segments[] } }
    │ segments[].steps[] = { action, role, name, text, explanation }
    │
    ▼
┌─────────────────────────────────────────────────┐
│ PHASE 3: SEGMENTATION (Frontend)                │
│ Location: buildMissionFromSegments()            │
│ Actions:                                         │
│ 1. Create missions/{{ id }}: {goal, status: 'active', tasks}
│ 2. Create task_queues/mission-header             │
│ 3. For each segment:                            │
│    - Create task_queues/segment-{{ i }}         │
│    - Map steps → subActions[]                   │
│ 4. Update missions.tasks with IDs               │
└─────────────────────────────────────────────────┘
    │
    │ Firestore State:
    │ ├─ missions/{{ id }}: {status: 'active', tasks: []}
    │ ├─ task_queues/mission-header: {isMission: true, status: 'in_progress'}
    │ ├─ task_queues/segment-1: {status: 'pending', missionId, subActions[]}
    │ └─ task_queues/segment-2: {status: 'pending', missionId, subActions[]}
    │
    ▼
    ┌─────────────────┬─────────────────┐
    │                 │                 │
    ▼                 ▼                 ▼
┌─────────────────┐ ┌──────────────────┐
│ EXECUTION PATH 1 │ │ EXECUTION PATH 2  │
│ FRONTEND MODE   │ │ BACKEND MODE      │
│ (Mobile/Web)    │ │ (Cloud Run)        │
└─────────────────┘ └──────────────────┘

[See Execution Paths Below]
```

---

## Execution Path 1: FRONTEND (Mobile & Web UI Mode)

```
┌─────────────────────────────────────────────────────────┐
│ MissionTaskExecutor starts listening                    │
│ Location: src/services/mission-task.executor.ts         │
│ Trigger: onSnapshot('missions', status=='active')      │
└─────────────────────────────────────────────────────────┘
    │
    ├─ Detects: missions/{{ id }} created
    │
    ├─ getCurrentTaskForMission(mission.tasks)
    │  └─ Returns: first pending task
    │
    ▼
    │ EXECUTION LOOP:
    ├─ executeTask(taskId, mission.goal)
    │
    ├─ For each subAction in task.subActions:
    │  │
    │  ├─ Action = 'click':
    │  │  └─ webViewRef.current.scanDOM() or remoteActions.executeAction()
    │  │
    │  ├─ Action = 'type':
    │  │  └─ sendKeys() + verification
    │  │
    │  ├─ Action = 'navigate':
    │  │  └─ page.goto()
    │  │
    │  ├─ Action = 'wait':
    │  │  └─ delay()
    │  │
    │  └─ Action = 'done':
    │     └─ Stop loop
    │
    ├─ Update Firestore:
    │  ├─ task_queues/taskId: {status: 'in_progress', progress: X%}
    │  └─ (via updateTask())
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│ Task Complete:                                          │
│ ├─ Mark task_queues/taskId: {status: 'completed'}      │
│ ├─ Advance next pending task to 'in_progress'          │
│ └─ Loop continues with next task                       │
└─────────────────────────────────────────────────────────┘
    │
    ├─ All tasks completed?
    │  └─ Update missions/{{ id }}: {status: 'completed'}
    │
    ▼
  [END]
```

---

## Execution Path 2: BACKEND (Cloud Run Mode)

```
┌─────────────────────────────────────────────────────────┐
│ processMissionStep(missionId) triggered                 │
│ Location: functions/lib/backend-mission.executor.js     │
│ Trigger: Cloud Tasks / Pub/Sub (mechanism unclear)     │
│ Frequency: ~Every N seconds or on-demand               │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│ STAGE 1: Load mission state                             │
│ └─ Load: missions/{{ missionId }}                      │
│    Check: status == 'active'                            │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│ STAGE 2: Get browser context                            │
│ ├─ getPersistentPage(tabId) → Playwright page         │
│ ├─ getAriaSnapshot(page) → ARIA tree                  │
│ ├─ page.screenshot() → screenshot.base64              │
│ └─ Save: missions/missionId: {lastAction: '📍 On: ...'} │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│ STAGE 3: LLM Decision (RE-PLANNING!)                    │
│ ├─ determineNextAction(goal, ariaSnapshot)            │
│ │  └─ Returns NEW MissionResponse                     │
│ │     (may differ from original plan!)                │
│ └─ Save: missions/missionId: {intelligenceSignals, reasoning} │
└─────────────────────────────────────────────────────────┘
    │
    │ 🚨 ISSUE: Backend plan may differ from task_queues!
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│ STAGE 4: Execute current segment                        │
│ ├─ findCurrentSegmentTask(missionId)                   │
│ │  └─ Query task_queues WHERE missionId                │
│ │     Priority: first 'in_progress', else first 'pending' │
│ ├─ Get: segmentOrder from matched task_queues         │
│ ├─ Select: segments[segOrder - 1] from NEW plan       │
│ │  (note: uses newly re-planned segments!)             │
│ └─ segmentIndex = segOrder - 1                         │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│ EXECUTION LOOP: For each step in segment.steps          │
│                                                          │
│ Update: missions: {lastAction: '⚙️ {{ action }}'}      │
│                                                          │
│ For steps[0..N]:                                         │
│  ├─ setSubActionStatus(taskDocId, idx, 'in_progress')  │
│  │                                                      │
│  ├─ Special Actions (no Playwright):                   │
│  │  ├─ 'done' → set missions: {status: 'completed'}   │
│  │  ├─ 'wait_for_user' → set missions: {status: 'waiting'} │
│  │  └─ 'record_knowledge' → saveContextualKnowledge()  │
│  │                                                      │
│  ├─ Playwright Actions:                                │
│  │  └─ executeStepWithRetry(page, step, useConfirmerAgent)
│  │     └─ Attempts: Up to 2x with post-action verify   │
│  │        Returns: {result, observation}               │
│  │                                                      │
│  ├─ Update subAction status:                           │
│  │  └─ setSubActionStatus(taskDocId, idx, result)     │
│  │                                                      │
│  ├─ Record memory:                                     │
│  │  └─ recordActionOutcome(action, result, observation)│
│  │                                                      │
│  └─ Update progress:                                   │
│     └─ missions: {progress: X%, lastAction: observation}│
│                                                          │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│ SEGMENT COMPLETE:                                        │
│ ├─ If segment failed:                                  │
│ │  └─ failSegmentTask(taskDocId)                       │
│ ├─ If segment succeeded:                               │
│ │  └─ completeSegmentTask(taskDocId, missionId, order) │
│ │     ├─ Set: task_queues: {status: 'completed'}       │
│ │     └─ Auto-advance: next pending → 'in_progress'    │
│ └─ Loop returns (waits for next processMissionStep call)│
└─────────────────────────────────────────────────────────┘
    │
    ▼
  [WAIT for next trigger]
```

---

## Key Differences: Frontend vs Backend

| Aspect | Frontend | Backend |
|--------|----------|---------|
| **Trigger** | onSnapshot() listener | Cloud Tasks / Pub/Sub |
| **Execution Model** | Sequential, single-threaded | Episodic (each call = one segment) |
| **Planner** | Called ONCE (POST /agent/plan) | Called EVERY cycle (determineNextAction) |
| **Browser Access** | HeadlessWebView component | Playwright persistent page |
| **ARIA** | DOM map / element ID | ARIA snapshot (stable) |
| **Task Data** | Reads mission.tasks array | Reads task_queues Firestore docs |
| **Updates** | Via updateTask() hook | Via task-queue-bridge.js |

---

## The Dual-Execution Problem

```
Timeline: Both paths active simultaneously

t=0s   Frontend starts → onSnapshot listening
t=1s   Backend starts → Cloud Tasks trigger
t=2s   Frontend executes subAction #1
t=3s   Backend executes step #1 (SAME step!)
       ↓
       Race condition:
       - Which execution wins?
       - Does page get TWO clicks?
       - Whose result is recorded?

t=4s   Frontend marks step #1 completed
t=5s   Backend marks step #1 completed (again)
       ↓
       Firestore write conflict?
```

---

## The Plan Divergence Problem

```
Planning Phase:
  determineNextAction(goal='Fill signup form')
    → Returns: segments: [
        {name: 'Enter email', steps: [...]},
        {name: 'Enter password', steps: [...]},
        {name: 'Click submit', steps: [...]}
      ]

  UI creates task_queues:
    ├─ task-1: {title: 'Enter email', ...}
    ├─ task-2: {title: 'Enter password', ...}
    └─ task-3: {title: 'Click submit', ...}

Execution Cycle 1 (t=5s):
  User sees: "Enter email" (highlighted)
  Backend executes: Email step successfully

Execution Cycle 2 (t=10s, after email complete):
  UI shows: "Enter password" (next task highlighted)
  
  BUT Backend calls determineNextAction() AGAIN:
    → NEW response: segments: [
        {name: 'Verify email sent', steps: [...]},
        {name: 'Check inbox', steps: [...]},
        {name: 'Enter password', steps: [...]}
      ]
  
  Backend finds: segment order=2 should execute
    → But task_queues order=2 is still "Enter password"
    → Mismatch! Wrong task executed or skipped
```

---

## Execution Decision Flow

```
When processMissionStep() is called:

┌─ Load missions/{{ id }}
│
├─ Is status == 'active'?
│  NO  → Exit (mission not active)
│  YES ↓
│
├─ Call determineNextAction()
│  → Get response with segments[]
│
├─ Find current task from task_queues
│  (this has segmentOrder from ORIGINAL plan)
│
├─ Select segment from NEW response
│  segments[segmentOrder - 1]  ← INDEX MISMATCH!
│
└─ Execute steps from NEW segment
   But task_queues has OLD steps
   ↓
   DIVERGENCE!
```

**The core issue**: Using segment order as an index assumes:
- Segments never change
- Segment count never changes
- BUT: Backend re-plans every cycle!

# Complete Code Flow Trace - Line-by-Line

## ENTRY POINT: App.tsx → User Prompt

```typescript
// App.tsx line 13
const s = useSentientBrowser(theme);

// This returns an object with handleExecutePrompt:
// useSentientBrowser.ts line 209-214:
handleExecutePrompt: async (p: string) => {
    const seedUrl = activeUrl || 'https://www.google.com';
    const newTabId = await addNewTab(seedUrl, 'Mission');
    return handleExecutePrompt(p, newTabId, auth.currentUser?.uid || 'anonymous', s.useConfirmerAgent ?? true);
}
```

---

## WIRE 1: UI → handleExecutePrompt

**Path**: MobileStreamLayout.tsx → MobileTaskQueueUI.tsx → LayoutSidebar.tsx → useSentientBrowser.ts

```
MobileStreamLayout.tsx line 94:
  const handleSubmit = () => { if (promptValue.trim()) { addTask(promptValue.trim()); } }
  
  ↓ props pass through hierarchy:
  
MobileTaskQueueUI.tsx line 47:
  {variant === 'stream' && <MobileStreamLayout {...layoutProps} />}
  where layoutProps = { tasks, theme, addTask, removeTask, clearTasks, editTask }
  
  ↓ props pass through hierarchy:
  
LayoutSidebar.tsx line 93:
  <MobileTaskQueueUI tasks={s.tasks} ... addTask={s.addTask} ... />
  
  ↓ comes from:
  
useSentientBrowser.ts line 209-214:
  handleExecutePrompt: async (p: string) => { 
    const newTabId = await addNewTab(seedUrl);
    return handleExecutePrompt(p, newTabId, userId, useConfirmer);
  }
```

**ISSUE #1**: `addTask` in mobile UI is NOT the same as `handleExecutePrompt`!

Looking back at MobileStreamLayout line 94:
```typescript
const handleSubmit = () => { 
  if (promptValue.trim()) { 
    addTask(promptValue.trim());  // ← This is from props!
    setPromptValue(''); 
  } 
};
```

But where does the UI `addTask` come from? Trace MobileTaskQueueUI props:

```typescript
// MobileTaskQueueUI line 36
const layoutProps = { tasks, theme, addTask, removeTask, clearTasks, editTask };

// MobileTaskQueueUI line 15
interface Props {
    addTask: (t: string) => void;  // ← Signature!
    ...
}

// LayoutSidebar line 95
<MobileTaskQueueUI
    tasks={s.tasks}
    ...
    addTask={s.addTask}  // ← From useSentientBrowser!
    ...
/>
```

**But wait!** Let me check what `s.addTask` actually is in useSentientBrowser:

```typescript
// useSentientBrowser.ts line 30
const { tasks, setTasks, addTask, updateTask, removeTask, clearTasks, editTask, reorderMissions, removeMissionTasks, removeTabTasks } = useTaskQueue();

// So s.addTask comes from useTaskQueue() hook
```

So the flow is:
1. User types prompt → handleSubmit → `addTask(promptValue)`
2. `addTask` is from useTaskQueue (NOT handleExecutePrompt)
3. But we need handleExecutePrompt to run!

**MISSING WIRE**: User prompt must somehow trigger `handleExecutePrompt`, not just `addTask`.

Let me search for where the UI calls handleExecutePrompt:

---

## WIRE 2: UI Prompt Submission → handleExecutePrompt ✅

**Path**: PromptInterface.tsx → useSentientBrowser.ts (handleExecutePrompt)

```typescript
// LayoutSidebar.tsx line 29
<PromptInterface onExecutePrompt={s.handleExecutePrompt} theme={theme} />

// PromptInterface.tsx line 56
const handleSend = async () => {
    const v = prompt.trim();
    if (!v || isPlanning) return;
    setPrompt('');
    setIsPlanning(true);
    try { await onExecutePrompt(v); }  // ← CALLS handleExecutePrompt!
    finally { setIsPlanning(false); }
};

// useSentientBrowser.ts line 209-214
handleExecutePrompt: async (p: string) => {
    const seedUrl = activeUrl || 'https://www.google.com';
    const newTabId = await addNewTab(seedUrl, 'Mission');
    return handleExecutePrompt(p, newTabId, auth.currentUser?.uid || 'anonymous', s.useConfirmerAgent ?? true);
}

// This calls: useBrowserController's handleExecutePrompt
// useBrowserController.ts line 22
const handleExecutePrompt = async (prompt: string, tabId: string, _userId: string, useConfirmerAgent = true) => {
    // ← ENTRY TO MAIN FLOW
}
```

---

## WIRE 3: useBrowserController.handleExecutePrompt → POST /agent/plan

**File**: src/hooks/useBrowserController.ts

```typescript
// useBrowserController.ts line 22-81
export const useBrowserController = (
    webViewRef,
    addTask,       // ← addTask from useTaskQueue
    setActivePrompt,
    setTaskStartTime,
    setStatusMessage,
    setIsPaused,
    isDaemonRunning,
    setIsDaemonRunning,
    PROXY_BASE_URL
) => {
    const handleExecutePrompt = async (prompt: string, tabId: string, _userId: string, useConfirmerAgent = true) => {
        const runId = `run_${Date.now()}`;
        setActivePrompt(prompt);
        setTaskStartTime(Date.now());

        // 1. Call cloud LLM for mission planning
        let missionResponse: any = null;
        let llmError: string | null = null;

        try {
            const token = await auth.currentUser?.getIdToken();
            
            // ↓ LINE 32: THE CRITICAL REQUEST
            const response = await fetch(`${PROXY_BASE_URL}/agent/plan`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token || 'anonymous'}` 
                },
                body: JSON.stringify({ 
                    prompt, 
                    tabId, 
                    ...getSchemaPayload()  // ← Includes schema context
                }),
            });
            
            if (response.ok) {
                const data = await response.json();
                missionResponse = data.missionResponse || data;
                console.info('[Planner] source=remote endpoint=/agent/plan status=ok');
            } else {
                const errText = await response.text().catch(() => '');
                llmError = `LLM endpoint error: ${response.status}${errText ? ` ${errText}` : ''}`;
            }
        } catch (e) { 
            llmError = e instanceof Error ? e.message : String(e); 
        }

        // 2. Do NOT fallback to a local planner.
        // Why: a second planner implementation creates divergent plans vs container runtime
        if (!missionResponse) {
            console.error(`[Planner] source=remote status=failed reason=${llmError || 'remote_unavailable'}`);
            setStatusMessage(`Planner unavailable: ${llmError || 'unknown error'}`);
            return;
        }

        // 3. Build mission tasks
        if (missionResponse?.execution?.segments) {
            // ↓ LINE 58: CALL buildMissionFromSegments
            await buildMissionFromSegments(
                prompt, 
                missionResponse, 
                llmError, 
                tabId, 
                runId, 
                { addTask, setStatusMessage, useConfirmerAgent }
            );
        } else {
            setStatusMessage('Planner returned invalid mission format');
            return;
        }

        webViewRef.current?.scanDOM();
        setIsPaused(false);
    };

    return { handleExecutePrompt, toggleDaemon, handleReload };
};
```

**Key Variables at this point**:
- `prompt`: User's mission description
- `tabId`: Browser tab ID (NEW tab created by addNewTab)
- `missionResponse`: From container `/agent/plan` endpoint
  - Structure: `{ meta, execution: { plan, segments[] } }`
  - `segments[]`: Array of executable segments
  - Each segment: `{ name, steps[] }`
  - Each step: `{ action, role, name, text, explanation, ... }`

---

## WIRE 4: POST /agent/plan (Container Endpoint)

**File**: functions/src/proxy-routes-browser.ts lines 25-82

```typescript
// proxy-routes-browser.ts line 33
app.post('/agent/plan', async (req, res): Promise<any> => {
    applyCorsHeaders(res);
    
    // Extract params
    const { prompt, schemaPrompt, tabId = 'default', userId: bodyUserId, url } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt required' });
    
    try {
        const userId = bodyUserId || (req as any).userId || 'anonymous';
        const runtimeApiKey = (req.headers['x-gemini-api-key'] as string) || undefined;

        let domain = 'general';
        let screenshotBase64: string | undefined;
        let ariaSnapshot: string | undefined;

        // Get current page context
        try {
            const page = await getPersistentPage(null, tabId, userId);
            if (page) {
                const pageUrl = page.url();
                domain = new URL(pageUrl || 'http://blank').hostname;
                ariaSnapshot = await getAriaSnapshot(page);  // ← ARIA from Playwright
                screenshotBase64 = (await page.screenshot({ quality: 30, type: 'jpeg' })).toString('base64');
            }
        } catch {
            if (url) {
                try { domain = new URL(url).hostname; } catch { domain = String(url); }
            }
        }

        const promptWithSchema = schemaPrompt
            ? `${prompt}\n\n${schemaPrompt}`
            : prompt;

        // ↓ LINE 63: CALL LLM DECISION ENGINE
        const missionResponse = await determineNextAction(
            userId,
            promptWithSchema,
            [],                    // domMap (empty, using ARIA instead)
            screenshotBase64,      // screenshot
            domain,
            [],                    // lookedUpDocs
            false,
            undefined,
            ariaSnapshot,          // ARIA snapshot preferred
            runtimeApiKey,
        );

        if (!missionResponse) {
            return res.status(502).json({ error: 'Mission planning failed: no response from decision engine' });
        }

        return res.json({ missionResponse });
    } catch (e: any) {
        return res.status(500).json({ error: 'Mission planning failed: ' + e.message });
    }
});
```

---

## WIRE 5: determineNextAction (LLM Decision Engine)

**File**: functions/src/features/llm/llm-decision.engine.ts lines 29-86

```typescript
// llm-decision.engine.ts line 29
export const determineNextAction = async (
  userId: string, 
  prompt: string, 
  domMap: any[], 
  screenshotBase64?: string,
  domain?: string, 
  lookedUpDocs: any[] = [], 
  isScholarMode: boolean = false, 
  context?: KnowledgeContext,
  ariaSnapshot?: string,
  apiKeyOverride?: string,
): Promise<MissionResponse | null> => {
    console.log('Sending page state to LLM. Domain:', domain, 'Scholar:', isScholarMode, 'ARIA:', !!ariaSnapshot, 'DOM:', domMap.length);

    // Get historical context
    const lessons = await getLessonsLearned(userId || 'anonymous', prompt);
    const relevantContext = context ? await getRelevantContext(userId || 'anonymous', context) : '';
    const resolvedPrompt = await buildGeminiPromptWithMemoryContext(prompt, domain, lookedUpDocs, isScholarMode);

    // Build page context (prefer ARIA over DOM map)
    const pageContext = ariaSnapshot
        ? `ARIA Snapshot (use role+name to identify elements):\n${ariaSnapshot}`
        : `DOM Map:\n${JSON.stringify(domMap, null, 2)}`;

    const userPayload = `
User Objective: ${resolvedPrompt}
Current Domain: ${domain || 'General Navigation'}
${lessons}
${relevantContext}
${pageContext}
`;

    try {
        const geminiKey = apiKeyOverride || process.env.GOOGLE_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
        if (!geminiKey) { 
            console.error('[LLM] ❌ STAGE 3 FAIL — no API key'); 
            return null; 
        }
        
        console.log(`[LLM] ✅ STAGE 3 — calling gemini-2.5-flash`);
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        
        const parts: any[] = [{ text: DECISION_SYSTEM_INSTRUCTION + '\n\n' + userPayload }];

        if (screenshotBase64) {
            const base64Data = screenshotBase64.split(',')[1] || screenshotBase64;
            parts.push({ inlineData: { data: base64Data, mimeType: 'image/png' } });
        }

        // ↓ CALL GEMINI 2.5 FLASH
        const result = await model.generateContent(parts);
        const llmResponseText = result.response.text();
        if (!llmResponseText) { 
            console.error('[LLM] ❌ STAGE 3 FAIL — empty response'); 
            return null; 
        }

        const cleanedText = llmResponseText.replace(/```json|```/g, '').trim();
        const parsed: MissionResponse = JSON.parse(cleanedText);

        parsed.meta.memoryUsed = cleanedText.toLowerCase().includes('memory');
        parsed.meta.intelligenceRating = parsed.meta.memoryUsed ? 95 : 65;

        console.log(`[LLM] ✅ STAGE 3 DONE — plan: "${parsed.execution.plan}" | steps: ${parsed.execution.segments.flatMap(s=>s.steps).length}`);
        return parsed;
    } catch (error: any) {
        console.error(`[LLM] ❌ STAGE 3 FAIL — Gemini error: ${error?.status ?? ''} ${error?.message ?? error}`);
        return null;
    }
};
```

**Output Structure**:
```typescript
interface MissionResponse {
  meta: {
    reasoning: string;
    intelligenceRating: number;
    intelligenceSignals?: string[];
    memoryUsed: boolean;
  };
  execution: {
    plan: string;
    segments: Array<{
      name: string;  // ← Task title user sees
      steps: Array<{
        action: 'click' | 'type' | 'navigate' | 'wait' | 'done' | ...
        role?: string;       // ARIA role
        name?: string;       // ARIA name
        text?: string;       // fallback text
        targetId?: string;   // legacy DOM selector
        explanation: string;
        goal?: string;       // NOT always present!
      }>
    }>
  }
}
```

---

## WIRE 6: Response → buildMissionFromSegments

**File**: src/hooks/mission-builder.ts lines 20-104

Response travels back to frontend:
```typescript
// useBrowserController.ts line 58 (AGAIN)
await buildMissionFromSegments(
    prompt, 
    missionResponse,  // ← The MissionResponse from container
    llmError, 
    tabId, 
    runId, 
    { addTask, setStatusMessage, useConfirmerAgent }
);
```

**File**: src/hooks/mission-builder.ts

```typescript
// mission-builder.ts line 20
export const buildMissionFromSegments = async (
    prompt: string,
    missionResponse: any,
    llmError: string | null,
    tabId: string,
    runIdOverride: string | null,
    deps: MissionBuilderDeps,
) => {
    const ACTION_DURATION_MS = 15000;
    const MISSION_SCHEMA_VERSION = 2;
    const now = Date.now();
    const segments = missionResponse.execution.segments;
    const missionId = now.toString();
    const runId = runIdOverride || `run_${missionId}`;
    const workflowId = tabId;
    const workspaceId = auth.currentUser?.uid || 'anonymous';

    const missionCardTitle = buildMissionHeaderTitle(prompt, segments?.[0]?.name);

    // ↓ CREATE MISSION HEADER TASK
    await deps.addTask(missionCardTitle, 'in_progress', `${segments.length} tasks planned`, {
        id: missionId,           // ← CRITICAL: uses missionId
        isMission: true,
        missionId,               // ← Points to itself
        progress: 0,
        runId,
        tabId,
        workflowId,
        workspaceId,
        order: 0,
        source: 'planner',
        startTime: now,
    });

    // ↓ CREATE SEGMENT TASKS
    const allMissionTasks: any[] = [];
    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const steps = seg.steps || [];
        const segName = seg.name || `Step ${i + 1}`;

        // Convert steps → subActions
        const subActions: SubAction[] = steps.map((step: any) => ({
            action: step.action || 'interact',
            goal: step.goal || segName,        // ← ISSUE: step.goal might be undefined!
            explanation: step.explanation || step.action,
            status: 'pending' as const,
        }));

        // Create task for this segment
        const taskId = await deps.addTask(
            segName,
            i === 0 ? 'in_progress' : 'pending',
            `${steps.length} action${steps.length !== 1 ? 's' : ''}`,
            {
                missionId,           // ← Links back to mission header
                runId,
                tabId,
                workflowId,
                workspaceId,
                order: i + 1,        // ← ORDER: 1, 2, 3, ...
                source: 'planner',
                subActions,          // ← Stores step info
                estimatedDuration: steps.length * ACTION_DURATION_MS,
                startTime: i === 0 ? now : undefined,
            },
        );

        for (const step of steps) {
            allMissionTasks.push({
                id: taskId + '-' + Math.random().toString(36).slice(2, 8),
                title: segName,
                action: step.action || 'Unknown action',
                status: 'pending',
                segment: segName,
                explanation: step.explanation,
                runId,
                tabId,
                workflowId,
                workspaceId,
                ...step,  // ← Includes: role, name, text, etc.
            });
        }
    }

    // ↓ PERSIST TO FIRESTORE (CRITICAL!)
    if (auth.currentUser && allMissionTasks.length > 0) {
        try {
            await setDoc(doc(db, 'missions', missionId), {
                id: missionId,
                userId: auth.currentUser.uid,
                goal: prompt,
                status: 'active',    // ← ENABLES BACKEND EXECUTION
                progress: 0,
                tasks: allMissionTasks,
                tabId,
                runId,
                taskCount: allMissionTasks.length,
                workflowId,
                workspaceId,
                lastAction: missionResponse.meta?.reasoning || 'Executing plan',
                startedAt: now,
                updatedAt: now,
                schemaVersion: MISSION_SCHEMA_VERSION,
                createdAt: now,
                missionResponse,      // ← Stores entire response!
                useConfirmerAgent: deps.useConfirmerAgent ?? true,
            });
        } catch (e) { 
            console.error('Failed to save mission:', e); 
        }
    }

    deps.setStatusMessage(llmError ? 'Tasks loaded (LLM fallback) — executing...' : 'Mission active — executing first task');
};
```

**Firestore State AFTER buildMissionFromSegments**:
```
Firestore:
├─ missions/{{ missionId }}:
│  ├─ id: missionId
│  ├─ goal: "User's prompt"
│  ├─ status: 'active'  ← TRIGGERS BACKEND EXECUTION
│  ├─ tasks: [...]      ← Local copy for reference
│  ├─ missionResponse: { meta, execution }  ← FULL RESPONSE STORED
│  └─ ...
│
└─ task_queues/{{ missionId }}-0:       ← Mission header (order: 0)
   ├─ id: missionId
   ├─ isMission: true
   ├─ title: "Mission: ..."
   ├─ status: 'in_progress'
   └─ progress: 0
   
├─ task_queues/{{ taskId }}-1:          ← Segment 1 (order: 1)
│  ├─ id: taskId
│  ├─ missionId: missionId
│  ├─ title: "segment.name" (from LLM)
│  ├─ status: 'in_progress'             ← First segment starts immediately!
│  ├─ order: 1
│  ├─ subActions: [
│  │  { action: 'click', goal: '...', explanation: '...', status: 'pending' },
│  │  { action: 'type', goal: '...', explanation: '...', status: 'pending' },
│  │  ...
│  │]
│  └─ progress: 0
│
└─ task_queues/{{ taskId }}-2:          ← Segment 2 (order: 2)
   ├─ missionId: missionId
   ├─ title: "segment.name"
   ├─ status: 'pending'
   ├─ order: 2
   ├─ subActions: [...]
   └─ progress: 0
```

---

## CRITICAL FORK: TWO EXECUTION PATHS

From here, TWO things can happen in parallel:

### PATH A: Frontend MissionTaskExecutor
**File**: src/services/mission-task.executor.ts

```typescript
// mission-task.executor.ts line 29
const q = query(
    collection(db, 'missions'), 
    where('userId', '==', auth.currentUser.uid), 
    where('status', '==', 'active')
);

this.unsubscribe = onSnapshot(q, (snapshot) => {
    snapshot.forEach(async (docSnap) => {
        const mission = docSnap.data();
        const missionId = docSnap.id;

        if (!mission.tasks || mission.tasks.length === 0) return;

        const currentTask = getCurrentTaskForMission(mission.tasks);
        
        if (currentTask && !this.currentlyExecuting) {
            await this.executeTask(missionId, currentTask, mission.goal);
        }
    });
});
```

**Triggered by**: `missions` collection `onSnapshot` listener
**Execution**: Frontend (mobile HeadlessWebView or remote mirror)
**Updates**: `task_queues` via `updateTask()` hook

---

### PATH B: Backend processMissionStep (Cloud Run)
**File**: functions/lib/backend-mission.executor.js lines 18-120

```typescript
// backend-mission.executor.js line 18
async function processMissionStep(missionId) {
    // STAGE 1: Load missions/{{ missionId }}
    const missionRef = db.collection('missions').doc(missionId);
    const snap = await missionRef.get();
    if (!snap.exists || snap.data().status !== 'active') return;
    
    const data = snap.data();
    const { tabId = 'default', userId } = data;
    
    // STAGE 2: Get browser context (Playwright page)
    const page = await getPersistentPage(null, tabId, userId);
    const currentUrl = page.url();
    const ariaSnapshot = await getAriaSnapshot(page);
    const screenshot = (await page.screenshot()).toString('base64');
    
    // STAGE 3: LLM Decision (RE-PLANNING!)
    const response = await determineNextAction(
        userId,
        data.goal,
        [],
        screenshot,
        new URL(currentUrl).hostname,
        [],
        true,
        context,
        ariaSnapshot
    );  // ← NEW RESPONSE (may differ from original plan!)
    
    // STAGE 4: Execute current segment
    const segments = response.execution.segments;
    const currentTask = await findCurrentSegmentTask(missionId);  // ← Query task_queues
    const taskDocId = currentTask?.id || null;
    const segOrder = currentTask?.order || 1;
    const activeSegment = segments[segOrder - 1] || segments[0];  // ← INDEX MISMATCH RISK!
    const steps = activeSegment?.steps || [];
    
    for (let stepIdx = 0; stepIdx < steps.length; stepIdx++) {
        const step = steps[stepIdx];
        
        // Execute step
        const { result, observation } = await executeStepWithRetry(page, step, useConfirmerAgent);
        
        // Update subAction status in task_queues
        await setSubActionStatus(taskDocId, stepIdx, result === 'success' ? 'completed' : 'failed');
    }
    
    // Complete segment
    if (taskDocId) {
        await completeSegmentTask(taskDocId, missionId, segOrder);
    }
}
```

**Triggered by**: Cloud Tasks or Pub/Sub (mechanism unclear)
**Execution**: Backend (Playwright in Cloud Run)
**Updates**: `task_queues` via `task-queue-bridge.js`
**CRITICAL**: Re-plans every cycle!

---

## CONFLICT MATRIX: Where Dual Execution Breaks

```
Timeline: Both frontendand backend active

t=0s   missions/{{ missionId }} created with status: 'active'

t=1s   Frontend MissionTaskExecutor detects mission via onSnapshot
       Backend processMissionStep Cloud Task fired

t=2s   Frontend calls: await executeTask()
       Backend calls: determineNextAction() → NEW RESPONSE

t=3s   Frontend: Executing task 1 (steps from ORIGINAL response)
       Backend: Executing segment 1 (steps from NEW response)
       
       🔴 CONFLICT: Different steps being executed!
       
       Frontend updates: task_queues/task-1 → { subActions[0]: completed }
       Backend updates: task_queues/task-1 → { subActions[0]: completed }
       
       Firestore last-write-wins:
       - Which subAction[] is actually stored?
       - Which progress% is shown?

t=4s   Frontend marks task 1 completed → auto-advances to task 2
       Backend marks task 1 completed → calls completeSegmentTask()
       
       🔴 RACE CONDITION: Who sets next task to 'in_progress'?
       
       Frontend advance logic: task-queue-progress.ts
       Backend advance logic: task-queue-bridge.js completeSegmentTask()
       
       Result: Task 2 might be marked in_progress TWICE or not at all!
       
t=5s   Frontend: executing task 2
       Backend: re-planning and might return DIFFERENT segments!
       
       🔴 PLAN DIVERGENCE:
       Original plan: [task1, task2, task3]
       Backend re-plan: [task1, task2-modified, task4-new]
       
       But frontend is still executing against task_queues from original plan
       
t=6s   Mismatch detected:
       - Frontend UI shows "task2" from original
       - Backend executes "task2-modified" from new plan
       - Users see wrong task titles / descriptions
```

---

## Summary: 7 Wires to Trace

1. **PromptInterface** → `handleExecutePrompt` ✅
2. **useBrowserController** → `POST /agent/plan` ✅
3. **determineNextAction** → Gemini → MissionResponse ✅
4. **buildMissionFromSegments** → Creates tasks_queues + missions ✅
5. **Frontend MissionTaskExecutor** → Executes from task_queues (PATH A)
6. **Backend processMissionStep** → Executes from missions (PATH B)
7. **Conflict**: Paths A & B can run simultaneously with divergent plans

---

## Data Structure Transformations

```
User Prompt
  "Complete the survey on example.com"
  
    ↓ (useBrowserController)
  
POST /agent/plan
  { prompt, tabId, schemaPrompt }
  
    ↓ (determineNextAction + Gemini)
  
MissionResponse
  {
    meta: { reasoning, intelligenceRating, memoryUsed },
    execution: {
      plan: "Navigate to site, find survey, fill form, submit",
      segments: [
        {
          name: "Navigate to survey",
          steps: [
            { action: "navigate", url: "...", explanation: "..." }
          ]
        },
        {
          name: "Find survey form",
          steps: [
            { action: "click", role: "button", name: "Start Survey", explanation: "..." }
          ]
        },
        {
          name: "Fill survey questions",
          steps: [
            { action: "type", targetId: "...", value: "...", explanation: "..." },
            { action: "click", role: "radio", name: "Option 2", explanation: "..." }
          ]
        },
        {
          name: "Submit form",
          steps: [
            { action: "click", role: "button", name: "Submit", explanation: "..." },
            { action: "done", explanation: "Form submitted" }
          ]
        }
      ]
    }
  }
  
    ↓ (buildMissionFromSegments)
  
Firestore missions/{{ missionId }}
  {
    id, goal, status: 'active', tasks, missionResponse,
    tabId, userId, useConfirmerAgent
  }
  
Firestore task_queues/{{ missionId }}-0
  {
    id: missionId,
    isMission: true,
    title: "Mission: Complete the survey...",
    status: 'in_progress',
    progress: 0
  }
  
Firestore task_queues/{{ taskId }}-1
  {
    missionId,
    order: 1,
    title: "Navigate to survey",           ← from segment.name
    status: 'in_progress',
    subActions: [
      {
        action: "navigate",
        goal: "Navigate to survey",        ← from segment.name (NOT step.goal!)
        explanation: "...",
        status: 'pending'
      }
    ]
  }
  
    ↓ (Frontend MissionTaskExecutor OR Backend processMissionStep)
  
Execution Loop:
  - Execute first subAction
  - Update subAction[0].status → 'completed'
  - Calculate progress: (completed + in_progress*0.5) / total * 100
  - Update task_queues progress%
  - When all subActions completed, advance next task to 'in_progress'
  
    ↓ (Firestore onSnapshot listeners)
  
Mobile UI sees updated progress in real-time
  - Mission card shows: "2/4 tasks completed"
  - Active task shows: "Filling survey form" with progress bar
  - Completed task shows: checkmark ✓
```

---

## Next: Identify All Conflict Points

Would you like me to map out:
1. Exact Firestore write conflicts?
2. Data mutation order issues?
3. Which fields can diverge?
4. How to detect conflicts at runtime?

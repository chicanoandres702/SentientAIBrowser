// Feature: AI Orchestration | Trace: proxy-page-handler.js
const { db } = require('./proxy-config');
const { collection, query, onSnapshot, doc, updateDoc, serverTimestamp, getDoc, addDoc } = require('firebase/firestore');
const { getPersistentPage } = require('./proxy-page-handler');
const { determineNextAction } = require('./src/features/llm/llm-decision.engine.ts');
const { recordActionOutcome } = require('./src/features/llm/llm-memory-service.ts');
const { saveContextualKnowledge } = require('./src/features/llm/knowledge-hierarchy.service.ts');

/**
 * Why: This orchestrator runs the AI loop on the server, 
 * allowing missions to continue without the frontend.
 */
class BackendAIOrchestrator {
    constructor() {
        this.activeMissions = new Map();
        this.isListening = false;
    }

    start() {
        if (this.isListening) return;
        this.isListening = true;
        console.log('[Orchestrator] Starting Backend AI Loop...');

        const q = query(collection(db, 'missions'));
        onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                const missionId = change.doc.id;
                const missionData = change.doc.data();

                if (missionData.status === 'active') {
                    this.startMissionLoop(missionId, missionData);
                } else {
                    this.stopMissionLoop(missionId);
                }
            });
        });
    }

    async startMissionLoop(missionId, data) {
        if (this.activeMissions.has(missionId)) return;
        
        console.log(`[Orchestrator] Launching Loop for Mission: ${data.goal}`);
        const intervalId = setInterval(async () => {
            await this.processMissionStep(missionId);
        }, 10000); 

        this.activeMissions.set(missionId, intervalId);
    }

    stopMissionLoop(missionId) {
        if (this.activeMissions.has(missionId)) {
            clearInterval(this.activeMissions.get(missionId));
            this.activeMissions.delete(missionId);
            console.log(`[Orchestrator] Stopped Mission: ${missionId}`);
        }
    }

    async processMissionStep(missionId) {
        try {
            const missionRef = doc(db, 'missions', missionId);
            const missionSnap = await getDoc(missionRef);
            if (!missionSnap.exists() || missionSnap.data().status !== 'active') return;

            const data = missionSnap.data();
            const tabId = data.tabId;
            const userId = data.userId;
            
            // Define context from mission metadata
            const context = {
                groupId: data.groupId || 'DefaultGroup',
                contextId: data.contextId || 'DefaultContext',
                unitId: missionId
            };
            
            const page = await getPersistentPage(null, tabId, userId);
            if (!page) return;

            const currentDomain = new URL(page.url()).hostname;

            // 1. Observe: Get DOM Map
            const domMap = await page.evaluate(() => {
                const elements = Array.from(document.querySelectorAll('button, a, input, [role="button"]'));
                return elements.map((el, i) => {
                    el.setAttribute('data-ai-id', i);
                    return {
                        id: i,
                        tagName: el.tagName,
                        text: el.innerText || el.value || el.placeholder,
                        type: el.type
                    };
                });
            });

            // 2. Decide: Run LLM Logic
            const screenshot = await page.screenshot({ encoding: 'base64', quality: 50, type: 'jpeg' });
            const decision = await determineNextAction(
                data.goal, 
                domMap, 
                screenshot, 
                currentDomain,
                [], 
                true, // Default scholar mode for complex tasks
                context
            );

            if (!decision) return;

            console.log(`[Orchestrator] Mission ${missionId} Decision: ${decision.action} on ${decision.targetId}`);

            // Handle record_knowledge
            if (decision.action === 'record_knowledge' && decision.value) {
                await saveContextualKnowledge(userId, context, 'rule', decision.value);
                await updateDoc(missionRef, { lastAction: `Saved specification: ${decision.value.substring(0, 30)}...` });
                return;
            }

            // 3. Act: Execute via Playwright
            let result = 'success';
            let observation = decision.reasoning;

            try {
                if (decision.action === 'click' && decision.targetId !== undefined) {
                    const targetSelector = `[data-ai-id="${decision.targetId}"]`;
                    await page.click(targetSelector, { timeout: 8000 });
                } else if (decision.action === 'type' && decision.targetId !== undefined && decision.value) {
                    const targetSelector = `[data-ai-id="${decision.targetId}"]`;
                    await page.fill(targetSelector, decision.value);
                    await page.keyboard.press('Enter');
                } else if (decision.action === 'done') {
                    await saveContextualKnowledge(userId, context, 'breadcrumb', `Completed: ${data.goal}`);
                    await updateDoc(missionRef, { status: 'completed', progress: 100 });
                    this.stopMissionLoop(missionId);
                    return;
                }
            } catch (err) {
                result = 'failure';
                observation = `Action failed: ${err.message}`;
            }

            // Record outcome for hybrid sync (shares navigation but not content)
            await recordActionOutcome(userId, data.goal, decision.action, result, observation, currentDomain);

            await updateDoc(missionRef, {
                lastAction: observation.substring(0, 100) + '...',
                progress: Math.min((data.progress || 0) + 5, 95),
                updated_at: serverTimestamp()
            });

        } catch (e) {
            console.error(`[Orchestrator] Fatal in mission ${missionId}:`, e.message);
        }
    }
}

module.exports = new BackendAIOrchestrator();

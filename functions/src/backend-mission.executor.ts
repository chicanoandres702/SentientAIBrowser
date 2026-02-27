// Feature: Mission Executor | Trace: backend-ai-orchestrator.js
import { db } from './proxy-config';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { getPersistentPage } from './proxy-page-handler';
import { determineNextAction } from './features/llm/llm-decision.engine';
import { recordActionOutcome } from './features/llm/llm-memory-service';
import { saveContextualKnowledge } from './features/llm/knowledge-hierarchy.service';

export async function processMissionStep(missionId: string) {
    try {
        const missionRef = doc(db, 'missions', missionId);
        const snap = await getDoc(missionRef);
        if (!snap.exists() || snap.data().status !== 'active') return;
        const data = snap.data();
        const tabId = data.tabId || 'default';
        const userId = data.userId;
        const context = { groupId: data.groupId || 'DefaultGroup', contextId: data.contextId || 'DefaultContext', unitId: missionId };
        
        const page = await getPersistentPage(null, tabId, userId);
        if (!page) return;

        const domMap = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('button, a, input, [role="button"]')).map((el: any, i) => {
                el.setAttribute('data-ai-id', i);
                return { id: i, tagName: el.tagName, text: el.innerText || el.value || el.placeholder, type: (el as any).type };
            });
        });

        const screenshot = (await page.screenshot({ quality: 50, type: 'jpeg' })).toString('base64');
        const decision = await determineNextAction(data.goal, domMap, screenshot, new URL(page.url()).hostname, [], true, context);
        if (!decision) return;

        if (decision.action === 'record_knowledge' && decision.value) {
            await saveContextualKnowledge(userId, context, 'rule', decision.value);
            await updateDoc(missionRef, { lastAction: `Saved knowledge: ${decision.value.substring(0, 30)}...` });
            return;
        }

        let result: 'success' | 'failure' = 'success';
        let observation = decision.reasoning;
        try {
            const sel = `[data-ai-id="${decision.targetId}"]`;
            if (decision.action === 'click') await page.click(sel, { timeout: 8000 });
            else if (decision.action === 'type' && decision.value) { 
                await page.fill(sel, decision.value); 
                await page.keyboard.press('Enter'); 
            }
            else if (decision.action === 'done') {
                await saveContextualKnowledge(userId, context, 'breadcrumb', `Completed: ${data.goal}`);
                await updateDoc(missionRef, { status: 'completed', progress: 100 });
                return 'done';
            }
        } catch (err: any) { 
            result = 'failure'; 
            observation = `Action failed: ${err.message}`; 
        }

        await recordActionOutcome(userId, data.goal, decision.action, result, observation, new URL(page.url()).hostname);
        await updateDoc(missionRef, { 
            lastAction: observation.substring(0, 100) + '...', 
            progress: Math.min((data.progress || 0) + 5, 95), 
            updated_at: serverTimestamp() 
        });
    } catch (e: any) { 
        console.error(`[Executor] Fatal in mission ${missionId}:`, e.message); 
    }
    return 'pending'; 
}

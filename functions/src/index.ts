import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { sentientProxy as proxyApp } from "./index-app";
import orchestrator from "./backend-ai-orchestrator";

export { proxyApp as sentientProxy };

/**
 * onMissionTrigger: 2nd Gen Firestore trigger that activates the AI orchestrator
 * when a mission is created or updated to 'active'.
 */
export const onMissionTrigger = onDocumentWritten({
  document: "missions/{missionId}",
  memory: "2GiB",
  timeoutSeconds: 300,
  cpu: 1,
}, async (event) => {
  const data = event.data?.after.data();
  if (!data || data.status !== "active") return;
  
  console.log(`[Trigger] Processing active mission: ${event.params.missionId}`);
  await orchestrator.processMission(event.params.missionId, data);
});

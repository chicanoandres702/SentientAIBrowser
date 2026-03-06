// Feature: Tasks | Trace: src/components/WorkflowPanel.tsx
// Extracted REST fire-and-forget task operations and plan extension logic

export function taskOp(proxyBaseUrl: string | undefined, taskId: string, op: 'retry' | 'skip' | 'block-user') {
  if (!proxyBaseUrl) return;
  fetch(`${proxyBaseUrl}/proxy/tasks/${taskId}/${op}`, { method: 'POST' }).catch(() => {});
}

export function getExtendPlan(mission: any, proxyBaseUrl: string | undefined, activeTabId?: string) {
  if (!mission || !proxyBaseUrl) return undefined;
  return () => fetch(`${proxyBaseUrl}/proxy/replan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ missionId: mission.id, tabId: activeTabId || 'default' })
  }).catch(() => {});
}

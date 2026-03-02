// Feature: Mission Execution | Trace: src/features/mission-execution/useTabCleanup.ts
/*
 * [Reusable Hook] Tab and mission cancellation with proxy cleanup
 * [Upstream] Browser state → [Downstream] Tab controllers
 * [Why] Extracted from useSentientBrowser to enable reuse in tab managers
 */
import { useCallback } from 'react';

export interface TabCleanupDeps {
  removeTabTasks: (id: string) => Promise<void>;
  closeTab: (id: string) => Promise<void>;
  PROXY_BASE_URL: string;
  tasks: any[];
}

export const useTabCleanup = ({ removeTabTasks, closeTab, PROXY_BASE_URL, tasks }: TabCleanupDeps) => {
  const closeTabWithCleanup = useCallback(
    async (id: string) => {
      // Why: only cancel mission tasks scoped to THIS tab (no workflowId).
      // Workflow-scoped missions survive tab closure so other tabs in the workflow can continue.
      const missionTasksForTab = tasks.filter((t) => t.isMission && t.tabId === id && !t.workflowId);
      if (missionTasksForTab.length > 0) {
        try {
          const { doc: fsDoc, updateDoc: fsUpdate } = await import('firebase/firestore');
          const { db: firestoreDb } = await import('../../features/auth/firebase-config');
          await Promise.all(
            missionTasksForTab.map((m) =>
              fsUpdate(fsDoc(firestoreDb, 'missions', m.id), {
                status: 'cancelled',
                updatedAt: Date.now(),
              }).catch(() => {}),
            ),
          );
        } catch {
          /* non-fatal */
        }
      }

      if (PROXY_BASE_URL) {
        await fetch(`${PROXY_BASE_URL}/proxy/tab/${id}`, { method: 'DELETE' }).catch(() => {});
      }

      await removeTabTasks(id);
      await closeTab(id);
    },
    [closeTab, removeTabTasks, tasks, PROXY_BASE_URL],
  );

  return { closeTabWithCleanup };
};

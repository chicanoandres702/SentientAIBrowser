// Feature: Mission Execution | Trace: src/features/mission-execution/useMissionCleanup.ts
/*
 * [Reusable Hook] Mission cancellation and task cleanup
 * [Upstream] Browser state → [Downstream] UI orchestrators
 * [Why] Extracted from useSentientBrowser to enable reuse in mission controllers
 */
import { useCallback } from 'react';

export interface MissionCleanupDeps {
  removeMissionTasks: (id: string) => Promise<void>;
  closeTab: (id: string) => Promise<void>;
  PROXY_BASE_URL: string;
}

export const useMissionCleanup = ({ removeMissionTasks, closeTab, PROXY_BASE_URL }: MissionCleanupDeps) => {
  const closeMission = useCallback(async (missionId: string, tabId?: string) => {
    // Cancel backend execution
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db: firestoreDb } = await import('../../features/auth/firebase-config');
      await updateDoc(doc(firestoreDb, 'missions', missionId), {
        status: 'cancelled',
        updatedAt: Date.now(),
      });
    } catch {
      /* non-fatal */
    }

    await removeMissionTasks(missionId);

    if (tabId && PROXY_BASE_URL) {
      await fetch(`${PROXY_BASE_URL}/proxy/tab/${tabId}`, { method: 'DELETE' }).catch(() => {});
    }

    if (tabId) {
      await closeTab(tabId);
    }
  }, [removeMissionTasks, closeTab, PROXY_BASE_URL]);

  return { closeMission };
};

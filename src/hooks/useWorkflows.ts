// Feature: Workflow | Trace: src/hooks/useWorkflows.ts
/*
 * [Parent Feature/Milestone] Workflow
 * [Child Task/Issue] Multi-tab workflow state management
 * [Subtask] add/select/remove workflows; register tabs into active workflow
 * [Upstream] useBrowserCapabilities -> [Downstream] WorkflowBar
 * [Law Check] 65 lines | Passed 100-Line Law
 */
import { useState, useCallback } from 'react';
import type { Workflow } from '../features/workflow/workflow.types';

const makeWfId = (): string => `wf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

export const useWorkflows = (initialTabId: string) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([
    { id: 'wf_default', name: 'Workspace 1', isActive: true, tabIds: [initialTabId] },
  ]);

  const activeWorkflowId = workflows.find(w => w.isActive)?.id ?? 'wf_default';

  const selectWorkflow = useCallback((id: string) => {
    setWorkflows(prev => prev.map(w => ({ ...w, isActive: w.id === id })));
  }, []);

  const addWorkflow = useCallback((name?: string, tabId?: string): string => {
    const id = makeWfId();
    setWorkflows(prev => {
      const label = name ?? `Workspace ${prev.length + 1}`;
      return [
        ...prev.map(w => ({ ...w, isActive: false })),
        { id, name: label, isActive: true, tabIds: tabId ? [tabId] : [] },
      ];
    });
    return id;
  }, []);

  const renameWorkflow = useCallback((id: string, name: string) => {
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, name: name.trim() || w.name } : w));
  }, []);

  const removeWorkflow = useCallback((id: string) => {
    setWorkflows(prev => {
      if (prev.length <= 1) return prev;
      const next = prev.filter(w => w.id !== id);
      if (prev.find(w => w.id === id)?.isActive && next.length > 0) {
        next[0] = { ...next[0], isActive: true };
      }
      return next;
    });
  }, []);

  const addTabToWorkflow = useCallback((workflowId: string, tabId: string) => {
    setWorkflows(prev => prev.map(w =>
      w.id === workflowId ? { ...w, tabIds: [...w.tabIds.filter(i => i !== tabId), tabId] } : w
    ));
  }, []);

  const removeTabFromAll = useCallback((tabId: string) => {
    setWorkflows(prev => prev.map(w => ({ ...w, tabIds: w.tabIds.filter(i => i !== tabId) })));
  }, []);

  return { workflows, activeWorkflowId, selectWorkflow, addWorkflow, renameWorkflow, removeWorkflow, addTabToWorkflow, removeTabFromAll };
};

// Feature: Workflow Tabs | Trace: src/features/workflow/WorkflowTabs.tsx
export function useWorkflowTabsGrouping(workflows) {
  return workflows.reduce((acc, w) => {
    const key = w.results?.includes('error') ? 'Error' : w.results?.includes('done') ? 'Completed' : 'Active';
    acc[key] = acc[key] || [];
    acc[key].push(w);
    return acc;
  }, {});
}

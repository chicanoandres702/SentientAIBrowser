// Feature: Workflow Tabs | Trace: src/features/workflow/WorkflowTabs.tsx
import { useState } from 'react';

export function useWorkflowTabsModal() {
  const [modal, setModal] = useState<{
    question: string;
    options: string[];
    showInput?: boolean;
    inputLabel?: string;
    onSelect: (opt: string, val?: string) => void;
  } | null>(null);
  return { modal, setModal };
}

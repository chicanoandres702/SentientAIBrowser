// Feature: Workflow Tabs | Trace: src/features/workflow/WorkflowTabsModal.tsx
import React from 'react';
import { ModalPrompt } from '../common/ModalPrompt';

export const WorkflowTabsModal = ({ modal, setModal }: { modal: any, setModal: any }) => (
  modal ? (
    <ModalPrompt
      question={modal.question}
      options={modal.options}
      showInput={modal.showInput}
      inputLabel={modal.inputLabel}
      onSelect={modal.onSelect}
      onClose={() => setModal(null)}
    />
  ) : null
);

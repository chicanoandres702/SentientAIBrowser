// Feature: Workflow Mobile Layout | Trace: src/features/workflow/WorkflowMobileLayout.tsx
import React from 'react';
import { ModalPrompt } from '../common/ModalPrompt';

interface ModalState {
  question: string;
  options: string[];
  showInput?: boolean;
  inputLabel?: string;
  onSelect: (opt: string, val?: string) => void;
}

interface Props {
  modal: ModalState | null;
  setModal: (modal: ModalState | null) => void;
}

export const WorkflowMobileModal: React.FC<Props> = ({ modal, setModal }) => (
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

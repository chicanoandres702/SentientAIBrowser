// Feature: Core | Trace: README.md
/**
 * AIDDE Metadata
 * Purpose: Terminal actions — ask_user, wait_for_user, done
 * Type: Handler
 * Max Lines: 60 (target: 38)
 */

interface TerminalStep {
  action: string;
  value?: string;
}

interface ActionContext {
  setInteractiveRequest: (req: { question: string; type: 'confirm' | 'input' } | null) => void;
  setIsInteractiveModalVisible: (v: boolean) => void;
  setIsPaused: (p: boolean) => void;
  setStatusMessage: (m: string) => void;
  cursorActions?: { hideCursor: () => void };
}

export const executeTerminalActions = async (step: TerminalStep, ctx: ActionContext): Promise<boolean> => {
  if (step.action === 'ask_user' && step.value) {
    ctx.setInteractiveRequest({
      question: step.value,
      type: step.value.includes('?') ? 'confirm' : 'input',
    });
    ctx.setIsInteractiveModalVisible(true);
    ctx.setIsPaused(true);
    ctx.setStatusMessage('Awaiting Input');
    return false;
  }

  if (step.action === 'wait_for_user') {
    ctx.setIsPaused(true);
    ctx.setStatusMessage('Awaiting User');
    return false;
  }

  if (step.action === 'done') {
    ctx.setStatusMessage('Task Complete');
    ctx.cursorActions?.hideCursor();
    return true;
  }

  return false;
};

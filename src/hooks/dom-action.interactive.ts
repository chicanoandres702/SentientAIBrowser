// Feature: Core | Trace: src/hooks/dom-action.interactive.ts
/*
 * [Extracted Logic] Interactive prompt actions for DOM executor
 * [Law Check] < 100 lines
 */
import { ActionContext } from './dom-action.executor';

export function handleInteractivePrompt(action: string, step: any, ctx: ActionContext): boolean {
  if (action === 'ask_user' && step.value) {
    ctx.setInteractiveRequest({ question: step.value, type: step.value.includes('?') ? 'confirm' : 'input' });
    ctx.setIsInteractiveModalVisible(true);
    ctx.setIsPaused(true);
    ctx.setStatusMessage('Awaiting Input');
    return false;
  }
  if (action === 'wait_for_user') {
    ctx.setIsPaused(true);
    ctx.setStatusMessage('Awaiting User');
    return false;
  }
  return null;
}

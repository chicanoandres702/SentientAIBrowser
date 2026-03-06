// Feature: Core | Trace: src/hooks/dom-action.misc.ts
/*
 * [Extracted Logic] Wait and done actions for DOM executor
 * [Law Check] < 100 lines
 */
import { ActionContext } from './dom-action.executor';

export async function handleMiscActions(action: string, ctx: ActionContext): Promise<boolean | null> {
  if (action === 'wait') {
    console.debug('[Executor] ⏳ wait 2s');
    ctx.setStatusMessage('Waiting...');
    ctx.cursorActions?.hideCursor();
    await new Promise(r => setTimeout(r, 2000));
    return true;
  }
  if (action === 'done') {
    console.log('[Executor] ✅ done — task complete');
    ctx.setStatusMessage('Task Complete');
    ctx.cursorActions?.hideCursor();
    return true;
  }
  return null;
}

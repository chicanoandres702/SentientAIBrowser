// Feature: Core | Trace: src/hooks/dom-action.navigation.ts
/*
 * [Extracted Logic] Navigation actions for DOM executor
 * [Law Check] < 100 lines
 */
import { ActionContext } from './dom-action.executor';

export async function handleNavigationAction(action: string, step: any, ctx: ActionContext): Promise<boolean | null> {
  if (action === 'navigate' && step.value) {
    console.log(`[Executor] 🔗 navigate → ${step.value}`);
    ctx.setStatusMessage('Navigating...');
    ctx.setActiveUrl?.(step.value);
    if (ctx.navigateActiveTab) { await ctx.navigateActiveTab(step.value); }
    else { ctx.setActiveUrl?.(step.value); }
    return true;
  }
  return null;
}

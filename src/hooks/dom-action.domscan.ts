// Feature: Core | Trace: src/hooks/dom-action.domscan.ts
/*
 * [Extracted Logic] DOM scan and verification actions for DOM executor
 * [Law Check] < 100 lines
 */
import { ActionContext } from './dom-action.executor';

export function handleDomScanActions(action: string, step: any, ctx: ActionContext): boolean | null {
  if (action === 'scan_dom') {
    console.debug('[Executor] 🔎 scan_dom triggered');
    ctx.webViewRef.current?.scanDOM();
    ctx.setStatusMessage('Scanning DOM...');
    return true;
  }
  if (action === 'verify' || action === 'extract_data') {
    ctx.webViewRef.current?.scanDOM();
    ctx.setStatusMessage('Verifying...');
    return true;
  }
  return null;
}

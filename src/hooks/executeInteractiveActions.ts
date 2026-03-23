// Feature: Core | Trace: README.md
/**
 * AIDDE Metadata
 * Purpose: Interactive actions — click, type, verify, extract_data, wait + ARIA resolver
 * Type: Handler
 * Max Lines: 60 (target: 52)
 */

import React from 'react';
import { runSideEffects } from '../features/dom-actions/dom-action.side-effects';

interface AriaSelector {
  role?: string;
  name?: string;
  text?: string;
}

interface RemoteActions {
  executeAction: (action: 'click' | 'type', targetId: string | undefined, value?: string, ariaSelector?: AriaSelector) => Promise<void>;
}

interface CursorActions {
  animateClick: (targetId: string) => Promise<boolean>;
  animateType: (targetId: string) => Promise<boolean>;
  hideCursor: () => void;
}

interface InteractiveStep {
  action: string;
  targetId?: string;
  value?: string;
  role?: string;
  name?: string;
  text?: string;
}

interface InteractiveContext {
  webViewRef: React.RefObject<{ executeAction: (action: string, targetId?: string, value?: string) => void }>;
  setStatusMessage: (m: string) => void;
  cursorActions?: CursorActions;
  remoteActions?: RemoteActions;
}

export const executeInteractiveActions = async (step: InteractiveStep, ctx: InteractiveContext): Promise<boolean> => {
  await runSideEffects(step, ctx as never);

  if (step.targetId) {
    ctx.setStatusMessage(`Executing: ${step.action}...`);

    if (ctx.cursorActions) {
      const isTypeAction = step.action === 'type';
      const animated = isTypeAction
        ? await ctx.cursorActions.animateType(step.targetId)
        : await ctx.cursorActions.animateClick(step.targetId);
      if (!animated) {
        ctx.setStatusMessage(`Cursor: target ${step.targetId} not found in DOM map`);
      }
    }

    if (ctx.remoteActions) {
      if (step.action === 'click' || step.action === 'type') {
        await ctx.remoteActions.executeAction(step.action, step.targetId, step.value);
      } else {
        ctx.setStatusMessage(`Remote action unsupported: ${step.action}`);
        return false;
      }
    } else {
      ctx.webViewRef.current?.executeAction(step.action, step.targetId, step.value);
    }
    return true;
  }

  const hasAriaSelector = !!(step.role || step.name || step.text);
  if (hasAriaSelector && (step.action === 'click' || step.action === 'type')) {
    ctx.setStatusMessage(`Executing: ${step.action} (ARIA)...`);
    if (ctx.remoteActions) {
      await ctx.remoteActions.executeAction(step.action, undefined, step.value, {
        role: step.role,
        name: step.name,
        text: step.text,
      });
      return true;
    }
    ctx.setStatusMessage('ARIA actions require the remote proxy (enable Remote Mirror)');
    return false;
  }

  if (step.action === 'verify' || step.action === 'extract_data') {
    ctx.webViewRef.current?.executeAction('scan_dom');
    ctx.setStatusMessage('Verifying...');
    return true;
  }

  if (step.action === 'wait') {
    ctx.setStatusMessage('Waiting...');
    ctx.cursorActions?.hideCursor();
    await new Promise(r => setTimeout(r, 2000));
    return true;
  }

  return false;
};

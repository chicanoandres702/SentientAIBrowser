// Feature: Core | Trace: README.md
/**
 * AIDDE Metadata
 * Purpose: Strategy-map dispatch orchestrator for DOM actions
 * Type: Executor wrapper
 * Max Lines: 100 (target: 75)
 */

import React from 'react';
import { HeadlessWebViewRef } from '../components/HeadlessWebView';
import { normalizeStep } from '../features/dom-actions/dom-action.normalizer';
import { executeTerminalActions } from './executeTerminalActions';
import { executeNavigationActions } from './executeNavigationActions';
import { executeInteractiveActions } from './executeInteractiveActions';

export interface CursorActions {
  animateClick: (targetId: string) => Promise<boolean>;
  animateType: (targetId: string) => Promise<boolean>;
  hideCursor: () => void;
}

export interface AriaSelector {
  role?: string;
  name?: string;
  text?: string;
}

export interface RemoteActions {
  executeAction: (action: 'click' | 'type', targetId: string | undefined, value?: string, ariaSelector?: AriaSelector) => Promise<void>;
}

interface ActionContext {
  activePrompt: string;
  activeUrl: string;
  webViewRef: React.RefObject<HeadlessWebViewRef>;
  navigateActiveTab?: (url: string) => Promise<void>;
  setActiveUrl?: (url: string) => void;
  setStatusMessage: (m: string) => void;
  setIsPaused: (p: boolean) => void;
  setBlockedReason: (r: string) => void;
  setIsBlockedModalVisible: (v: boolean) => void;
  setInteractiveRequest: (req: { question: string; type: 'confirm' | 'input' } | null) => void;
  setIsInteractiveModalVisible: (v: boolean) => void;
  cursorActions?: CursorActions;
  remoteActions?: RemoteActions;
}

export const executeDomAction = async (rawStep: unknown, ctx: ActionContext): Promise<boolean> => {
  const step = normalizeStep(rawStep);

  const terminalResult = await executeTerminalActions(step, {
    setInteractiveRequest: ctx.setInteractiveRequest,
    setIsInteractiveModalVisible: ctx.setIsInteractiveModalVisible,
    setIsPaused: ctx.setIsPaused,
    setStatusMessage: ctx.setStatusMessage,
    cursorActions: ctx.cursorActions,
  });
  if (terminalResult) return true;

  const navigationResult = await executeNavigationActions(step, {
    webViewRef: ctx.webViewRef,
    navigateActiveTab: ctx.navigateActiveTab,
    setActiveUrl: ctx.setActiveUrl,
    setStatusMessage: ctx.setStatusMessage,
  });
  if (navigationResult) return true;

  const interactiveResult = await executeInteractiveActions(step, {
    webViewRef: ctx.webViewRef,
    setStatusMessage: ctx.setStatusMessage,
    cursorActions: ctx.cursorActions,
    remoteActions: ctx.remoteActions,
  });
  if (interactiveResult) return true;

  return false;
};

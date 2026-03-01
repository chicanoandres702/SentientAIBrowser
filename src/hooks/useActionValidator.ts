// Feature: Core | Trace: README.md
/**
 * AIDDE Metadata
 * Purpose: Confirmer validation, shouldConfirm pattern matching, confirmAction call
 * Type: Micro-hook
 * Max Lines: 100 (target: 38)
 */

import { useCallback } from 'react';
import { shouldConfirm, confirmAction } from '../features/agent/confirmer.service';

interface ValidationAction {
  action: string;
  explanation?: string;
}

interface ValidationResult {
  confirmed: boolean;
  reason: string;
}

interface ActionValidatorParams {
  firstStep: ValidationAction;
  activePrompt: string;
  activeUrl: string;
}

export const useActionValidator = (): ((params: ActionValidatorParams) => Promise<ValidationResult>) => {
  return useCallback(async (params: ActionValidatorParams): Promise<ValidationResult> => {
    if (!shouldConfirm(params.firstStep.action)) {
      return { confirmed: true, reason: 'No confirmation needed' };
    }

    const result = await confirmAction(
      params.firstStep.action,
      params.firstStep.explanation || '',
      params.activePrompt,
      params.activeUrl,
      'fast',
    );

    return result;
  }, []);
};

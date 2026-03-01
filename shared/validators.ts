// Feature: Core | Trace: README.md
/*
 * [Parent Feature/Milestone] Core
 * [Child Task/Issue] Validation consolidation
 * [Subtask] Centralized validators for common patterns (email, URL, status)
 * [Upstream] Scattered validation logic -> [Downstream] Single validator API
 * [Law Check] 75 lines | Passed 100-Line Law
 */

/**Validate email format */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

/**Validate URL format */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**Validate non-empty string */
export const isNonEmptyString = (value: unknown): boolean => typeof value === 'string' && value.trim().length > 0;

/**Validate positive integer */
export const isPositiveInt = (value: unknown): boolean => Number.isInteger(value) && (value as number) > 0;

/**Validate string length */
export const isValidLength = (value: string, min: number = 0, max?: number): boolean => {
  const len = value.length;
  if (len < min) return false;
  return max === undefined || len <= max;
};

/**Validate task status */
export const isValidTaskStatus = (status: unknown): status is 'pending' | 'in_progress' | 'completed' | 'failed' =>
  typeof status === 'string' && ['pending', 'in_progress', 'completed', 'failed'].includes(status);

/**Validate action type */
export const isValidActionType = (type: unknown): type is 'click' | 'type' | 'navigate' | 'scan_dom' | 'done' =>
  typeof type === 'string' && ['click', 'type', 'navigate', 'scan_dom', 'done'].includes(type);

/**Validate object has required string key-values */
export const hasRequiredFields = <T extends Record<string, unknown>>(obj: T, fields: (keyof T)[]): boolean =>
  fields.every((field) => isNonEmptyString(obj[field]));

/**Sanitize user input: trim and limit length */
export const sanitizeInput = (value: string, maxLength: number = 1000): string => value.trim().slice(0, maxLength);

/**Validate value is in allowed set */
export const isInAllowedSet = <T>(value: T, allowedValues: readonly T[]): boolean => allowedValues.includes(value);

// Feature: Core | Trace: README.md
/*
 * [Parent Feature/Milestone] Core
 * [Child Task/Issue] Type guards consolidation
 * [Subtask] Centralized type checking and runtime validation
 * [Upstream] Scattered typeof checks -> [Downstream] Reusable type guards
 * [Law Check] 72 lines | Passed 100-Line Law
 */

/**Type Guard: Narrow unknown to string */
export const isString = (value: unknown): value is string => typeof value === 'string';

/**Type Guard: Narrow unknown to number */
export const isNumber = (value: unknown): value is number => typeof value === 'number';

/**Type Guard: Narrow unknown to boolean */
export const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';

/**Type Guard: Narrow unknown to array */
export const isArray = <T = unknown>(value: unknown): value is T[] => Array.isArray(value);

/**Type Guard: Narrow unknown to object (non-null, non-array) */
export const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**Type Guard: Narrow to specific object keys */
export const hasProperty = <T extends object, K extends PropertyKey>(obj: T, key: K): obj is T & Record<K, unknown> =>
  key in obj;

/**Type Guard: All array elements match type */
export const allMatch = <T>(arr: unknown, predicate: (item: unknown) => item is T): arr is T[] =>
  isArray(arr) && arr.every(predicate);

/**Type Guard: At least one array element matches type */
export const someMatch = <T>(arr: unknown, predicate: (item: unknown) => item is T): boolean =>
  isArray(arr) && arr.some(predicate);

/**Assertion: Value is truthy */
export const assertTruthy = <T>(value: T | null | undefined, msg: string = 'Value must be truthy'): asserts value is T => {
  if (!value) throw new Error(msg);
};

/**Assertion: Value matches predicate */
export const assert = <T>(value: unknown, predicate: (v: unknown) => v is T, msg: string): asserts value is T => {
  if (!predicate(value)) throw new Error(msg);
};

/**Safe cast with validation */
export const safeCast = <T>(value: unknown, guard: (v: unknown) => v is T, fallback: T): T => guard(value) ? value : fallback;

/**Check if value is error-like (has message property) */
export const isError = (value: unknown): value is Error => value instanceof Error || (isObject(value) && 'message' in value);

/**Check if value is null or undefined */
export const isNil = (value: unknown): value is null | undefined => value === null || value === undefined;

/**Check if value is neither null nor undefined */
export const isDefined = <T>(value: T | null | undefined): value is T => value !== null && value !== undefined;

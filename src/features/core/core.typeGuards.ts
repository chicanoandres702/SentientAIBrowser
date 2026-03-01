// Feature: Core | Trace: README.md
/*
 * [Parent Feature/Milestone] Core
 * [Child Task/Issue] Type guard consolidation
 * [Subtask] Reusable type checking and validation utilities
 * [Upstream] Scattered type checks -> [Downstream] Single type guard library
 * [Law Check] 72 lines | Passed 100-Line Law
 */

export const isString = (value: unknown): value is string => typeof value === 'string';
export const isNumber = (value: unknown): value is number => typeof value === 'number';
export const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
export const isArray = (value: unknown): value is unknown[] => Array.isArray(value);
export const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
export const hasProperty = <T extends object, K extends PropertyKey>(obj: T, key: K): obj is T & Record<K, unknown> => key in obj;
export const allMatch = <T,>(arr: unknown[], guard: (v: unknown) => v is T): arr is T[] => isArray(arr) && arr.every(guard);
export const someMatch = <T,>(arr: unknown[], guard: (v: unknown) => v is T): boolean => isArray(arr) && arr.some(guard);
export const assertTruthy = (value: unknown, message: string): asserts value => { if (!value) throw new Error(message); };
export const assert = <T,>(value: unknown, guard: (v: unknown) => v is T, message: string): asserts value is T => {
  if (!guard(value)) throw new Error(message);
};
export const safeCast = <T,>(value: unknown, guard: (v: unknown) => v is T, fallback: T): T => (guard(value) ? value : fallback);
export const isError = (value: unknown): value is Error => value instanceof Error;
export const isNil = (value: unknown): value is null | undefined => value === null || value === undefined;
export const isDefined = (value: unknown): value is unknown => value !== null && value !== undefined;

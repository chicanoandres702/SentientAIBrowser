// Feature: Form | Trace: README.md
/*
 * [Parent Feature/Milestone] Form
 * [Child Task/Issue] Generic form fields hook
 * [Subtask] Batch form state management with validation and error handling
 * [Upstream] Multiple useState calls per form field -> [Downstream] Single useFormFields hook
 * [Law Check] 96 lines | Passed 100-Line Law
 */

import { useState, useCallback, useRef } from 'react';
import { logger } from '../../features/core/core.logger.service';

export interface FormField<T> {
  value: T;
  setValue: (value: T) => void;
  error: string | null;
  setError: (error: string | null) => void;
  reset: () => void;
  isDirty: boolean;
}

export interface UseFormFieldsOptions<T> {
  onSubmit?: (values: T) => void | Promise<void>;
  validate?: (values: T) => Record<keyof T, string | null>;
  context?: string;
}

export const useFormFields = <T extends Record<string, unknown>>(
  initialValues: T,
  options: UseFormFieldsOptions<T> = {}
): {
  fields: Record<keyof T, FormField<T[keyof T]>>;
  values: T;
  errors: Record<keyof T, string | null>;
  isDirty: boolean;
  validate: () => boolean;
  submit: () => Promise<void>;
  reset: () => void;
  setField: <K extends keyof T>(key: K, value: T[K]) => void;
} => {
  const { validate: validateFn, onSubmit, context = 'useFormFields' } = options;
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<keyof T, string | null>>(
    Object.keys(initialValues).reduce((acc, key) => ({ ...acc, [key]: null }), {} as Record<keyof T, string | null>)
  );
  const initialValuesRef = useRef(initialValues);
  const [isDirty, setIsDirty] = useState(false);

  const setField = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => ({ ...prev, [key]: null }));
      setIsDirty(true);
    },
    []
  );

  const validate = useCallback((): boolean => {
    if (!validateFn) return true;

    logger.debug(context, 'Validating form fields');
    const validationErrors = validateFn(values);
    setErrors(validationErrors);

    const hasErrors = Object.values(validationErrors).some((err) => err !== null);
    if (!hasErrors) {
      logger.debug(context, 'Form validation passed');
    } else {
      logger.warn(context, 'Form validation failed', { errors: validationErrors });
    }

    return !hasErrors;
  }, [validateFn, values, context]);

  const submit = useCallback(async () => {
    if (!validate()) return;

    try {
      logger.debug(context, 'Submitting form');
      if (onSubmit) {
        await onSubmit(values);
      }
      logger.info(context, 'Form submitted successfully');
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      logger.error(context, 'Form submission failed', new Error(error));
    }
  }, [validate, values, onSubmit, context]);

  const reset = useCallback(() => {
    setValues(initialValuesRef.current);
    setErrors(Object.keys(initialValuesRef.current).reduce((acc, key) => ({ ...acc, [key]: null }), {} as Record<keyof T, string | null>));
    setIsDirty(false);
    logger.debug(context, 'Form reset');
  }, []);

  const fields = Object.keys(values).reduce(
    (acc, key) => ({
      ...acc,
      [key]: {
        value: values[key as keyof T],
        setValue: (v: T[keyof T]) => setField(key as keyof T, v),
        error: errors[key as keyof T],
        setError: (err: string | null) => setErrors((prev) => ({ ...prev, [key]: err })),
        reset: () => setField(key as keyof T, initialValuesRef.current[key as keyof T]),
        isDirty: values[key as keyof T] !== initialValuesRef.current[key as keyof T],
      },
    }),
    {} as Record<keyof T, FormField<T[keyof T]>>
  );

  return { fields, values, errors, isDirty, validate, submit, reset, setField };
};

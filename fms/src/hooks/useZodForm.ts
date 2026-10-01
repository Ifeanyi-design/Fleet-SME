import { useCallback, useState } from 'react';
import type { SafeParseReturnType } from 'zod';

/**
 * Minimal typed form state bound to a Zod schema.
 *
 * Declared structurally (rather than as `ZodType<T>`) so schemas that use
 * `.refine()` / `.superRefine()` — which produce ZodEffects — satisfy it without
 * variance gymnastics. No resolver dependency needed.
 */
export interface FormSchema<T> {
  safeParse: (value: unknown) => SafeParseReturnType<unknown, T>;
}

export type FormErrors<T> = Partial<Record<keyof T & string, string>>;

export interface UseZodFormResult<T> {
  values: T;
  errors: FormErrors<T>;
  submitting: boolean;
  setSubmitting: (value: boolean) => void;
  setField: <K extends keyof T & string>(key: K, value: T[K]) => void;
  setValues: (values: T) => void;
  /** Validate; returns the parsed data or null (and populates `errors`). */
  validate: () => T | null;
  reset: (next?: T) => void;
}

export function useZodForm<T>(schema: FormSchema<T>, initial: T): UseZodFormResult<T> {
  const [values, setValuesState] = useState<T>(initial);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [submitting, setSubmitting] = useState(false);

  const setField = useCallback(<K extends keyof T & string>(key: K, value: T[K]) => {
    setValuesState((prev) => ({ ...prev, [key]: value }));
    // Clear the error for a field as soon as the user edits it.
    setErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const setValues = useCallback((next: T) => {
    setValuesState(next);
  }, []);

  const validate = useCallback((): T | null => {
    const result = schema.safeParse(values);
    if (result.success) {
      setErrors({});
      return result.data;
    }
    const fieldErrors: FormErrors<T> = {};
    for (const issue of result.error.issues) {
      // Top-level key only — nested item errors surface under "items".
      const key = String(issue.path[0] ?? '_form') as keyof T & string;
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    setErrors(fieldErrors);
    return null;
  }, [schema, values]);

  const reset = useCallback(
    (next?: T) => {
      setValuesState(next ?? initial);
      setErrors({});
      setSubmitting(false);
    },
    [initial],
  );

  return { values, errors, submitting, setSubmitting, setField, setValues, validate, reset };
}

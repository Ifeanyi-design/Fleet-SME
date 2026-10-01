import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** style.md §6.3 — label + control + helper + error wrapper. */

export interface FieldProps {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  helper?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}

export function Field({
  label,
  htmlFor,
  required = false,
  helper,
  error,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="mb-1.5 text-[13px] font-medium text-ink-body"
        >
          {label}
          {required && <span className="ml-0.5 text-state-error">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-state-error">{error}</p>
      ) : helper ? (
        <p className="mt-1.5 text-xs text-ink-secondary">{helper}</p>
      ) : null}
    </div>
  );
}

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** style.md §6.3 — text input. h-10 default, h-11 for topbar search. */

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
  invalid?: boolean;
  inputSize?: 'md' | 'lg';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, leftIcon, rightSlot, invalid = false, inputSize = 'md', ...props },
  ref,
) {
  return (
    <div className="relative w-full">
      {leftIcon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
          {leftIcon}
        </span>
      )}
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          'w-full rounded-control border bg-white text-sm text-ink-primary shadow-xs',
          'placeholder:text-ink-muted transition-colors duration-150',
          'focus:outline-none focus:ring-2',
          inputSize === 'md' ? 'h-10 px-3.5' : 'h-11 px-4',
          leftIcon && 'pl-10',
          rightSlot && 'pr-10',
          invalid
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500/25'
            : 'border-hairline-strong focus:border-brand-500 focus:ring-brand-500/25',
          'disabled:cursor-not-allowed disabled:bg-surface-hover disabled:text-ink-muted',
          className,
        )}
        {...props}
      />
      {rightSlot && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2">{rightSlot}</span>
      )}
    </div>
  );
});

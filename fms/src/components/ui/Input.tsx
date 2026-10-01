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
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted transition-colors">
          {leftIcon}
        </span>
      )}
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          'w-full rounded-control border bg-white text-sm text-ink-primary shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
          'placeholder:text-ink-muted/80 transition-all duration-150',
          'focus:outline-none focus:ring-2',
          inputSize === 'md' ? 'h-9 px-3.5' : 'h-10 px-4',
          leftIcon && 'pl-10',
          rightSlot && 'pr-10',
          invalid
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
            : 'border-hairline-strong/80 hover:border-hairline-hover focus:border-brand-500 focus:ring-brand-500/20',
          'disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-ink-disabled disabled:shadow-none',
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

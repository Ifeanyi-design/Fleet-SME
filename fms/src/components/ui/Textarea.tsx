import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/** Multi-line input — style.md §6.3. */

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid = false, rows = 3, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(
        'w-full resize-y rounded-control border bg-white px-3.5 py-2.5 text-sm text-ink-primary shadow-xs',
        'placeholder:text-ink-muted transition-colors duration-150 focus:outline-none focus:ring-2',
        invalid
          ? 'border-red-400 focus:border-red-500 focus:ring-red-500/25'
          : 'border-hairline-strong focus:border-brand-500 focus:ring-brand-500/25',
        'disabled:cursor-not-allowed disabled:bg-surface-hover disabled:text-ink-muted',
        className,
      )}
      {...props}
    />
  );
});

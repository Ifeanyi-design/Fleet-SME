import { forwardRef, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Native select styled to style.md §6.3. Uses the platform picker (best mobile UX,
 * fully accessible) — swapped for a Radix listbox only if richer options are needed.
 */

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, options, invalid = false, ...props },
  ref,
) {
  return (
    <div className="relative w-full">
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          'h-10 w-full appearance-none rounded-control border bg-white px-3.5 pr-9 text-sm text-ink-primary shadow-xs',
          'transition-colors duration-150 focus:outline-none focus:ring-2',
          invalid
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500/25'
            : 'border-hairline-strong focus:border-brand-500 focus:ring-brand-500/25',
          'disabled:cursor-not-allowed disabled:bg-surface-hover disabled:text-ink-muted',
          className,
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
        aria-hidden
      />
    </div>
  );
});

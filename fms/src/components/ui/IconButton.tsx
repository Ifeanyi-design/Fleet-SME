import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/** style.md §6.1 — square icon button (toolbar / row actions). */

export type IconButtonVariant = 'ghost' | 'outline';
export type IconButtonSize = 'sm' | 'md';

const VARIANT: Record<IconButtonVariant, string> = {
  ghost: 'text-ink-secondary hover:bg-surface-hover hover:text-ink-primary',
  outline: 'border border-hairline-strong bg-white text-ink-body hover:bg-surface-hover',
};

const SIZE: Record<IconButtonSize, string> = {
  sm: 'size-9',
  md: 'size-10',
};

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  /** Accessible label — required since there is no visible text. */
  label: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { className, variant = 'ghost', size = 'sm', label, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      className={cn(
        'inline-grid place-items-center rounded-control transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-1 focus-visible:ring-offset-white',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});

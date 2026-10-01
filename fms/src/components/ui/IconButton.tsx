import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/** style.md §6.1 — square icon button (toolbar / row actions). */

export type IconButtonVariant = 'ghost' | 'outline';
export type IconButtonSize = 'sm' | 'md';

const VARIANT: Record<IconButtonVariant, string> = {
  ghost: 'text-ink-secondary hover:bg-surface-hover hover:text-ink-primary',
  outline: 'border border-hairline-strong/80 bg-white text-ink-body shadow-xs hover:border-hairline-hover hover:bg-surface-hover hover:text-ink-primary hover:shadow-sm',
};

const SIZE: Record<IconButtonSize, string> = {
  sm: 'size-8 rounded-[8px]',
  md: 'size-9 rounded-control',
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
        'inline-grid place-items-center transition-all duration-150 active:scale-[0.95]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 focus-visible:ring-offset-1 focus-visible:ring-offset-white',
        'disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none',
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


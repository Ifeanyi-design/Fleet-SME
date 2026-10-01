import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/** style.md §6.4 — badges & status pills. Always rounded-full, tint bg + same-hue text. */

export type BadgeVariant = 'success' | 'warning' | 'info' | 'error' | 'neutral' | 'brand';

const VARIANT: Record<BadgeVariant, string> = {
  success: 'bg-brand-100 text-brand-700',
  brand: 'bg-brand-100 text-brand-700',
  warning: 'bg-amber-100 text-amber-700',
  info: 'bg-blue-100 text-blue-700',
  error: 'bg-red-100 text-red-700',
  neutral: 'bg-gray-100 text-gray-500',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  /** Render a leading status dot in the current text colour. */
  dot?: boolean;
}

export function Badge({ className, variant = 'neutral', dot = false, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium transition-colors duration-150',
        VARIANT[variant],
        className,
      )}
      {...props}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

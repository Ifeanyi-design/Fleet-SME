import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/** style.md §6.4 — badges & status pills. Always rounded-full, tint bg + same-hue text. */

export type BadgeVariant = 'success' | 'warning' | 'info' | 'error' | 'neutral' | 'brand';

/* ── Refined badge variants ────────────────────────────────────────────────────
   Each variant now has an inset ring border (ring-1 ring-inset) that creates
   a crisp edge between the pill and any background (inspired by NexaFleet & Quick Courier).
*/
const VARIANT: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
  brand:   'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-600/20',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
  info:    'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20',
  error:   'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20',
  neutral: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/10',
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
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] font-medium tracking-tight',
        'transition-colors duration-150',
        VARIANT[variant],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className="size-1.5 rounded-full bg-current opacity-80"
          aria-hidden
        />
      )}
      {children}
    </span>
  );
}


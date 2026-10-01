import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Card } from '@/components/ui/Card';

/** style.md §6.2 — compact stat tile used across the Operations Dashboard (FR8). */

export type StatTone = 'default' | 'success' | 'warning' | 'info' | 'error';

/* ── Icon badge: gradient background for extra visual punch ─────────────────
   Each tone gets a gradient that draws from the same hue family, giving the
   icon a more premium look vs a flat tint (inspired by NexaFleet KPI cards). */
const ICON_TONE: Record<StatTone, string> = {
  default: 'bg-gradient-to-br from-gray-100 to-gray-200 text-ink-secondary',
  success: 'bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700',
  warning: 'bg-gradient-to-br from-amber-50 to-amber-100 text-amber-700',
  info:    'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700',
  error:   'bg-gradient-to-br from-red-50 to-red-100 text-red-700',
};

/* ── Left-border accent strip per tone ───────────────────────────────────────
   A 3 px colored left border anchors the card to a semantic colour at a glance
   (a common pattern in the Cureer & NexaFleet reference dashboards). */
const BORDER_ACCENT: Record<StatTone, string> = {
  default: 'border-l-4 border-l-gray-300',
  success: 'border-l-4 border-l-brand-500',
  warning: 'border-l-4 border-l-amber-400',
  info:    'border-l-4 border-l-blue-500',
  error:   'border-l-4 border-l-red-500',
};

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  tone?: StatTone;
  /** e.g. { value: 12, direction: 'up', label: 'vs last week' } */
  delta?: { value: number; direction: 'up' | 'down'; label?: string };
  className?: string;
}

export function StatCard({ label, value, icon, tone = 'default', delta, className }: StatCardProps) {
  return (
    /* Merge the accent border into the card itself — flush keeps padding manual */
    <Card flush className={cn('flex flex-col justify-between p-3.5 sm:p-4 overflow-hidden', BORDER_ACCENT[tone], className)}>
      {/* ── Top row: Label has full width of the card — no longer squeezed by the icon ── */}
      <div className="min-w-0">
        <p className="text-[11px] 2xl:text-xs font-bold uppercase tracking-wider text-ink-muted leading-tight line-clamp-2">
          {label}
        </p>
      </div>

      {/* ── Bottom row: Big bold number on the left, icon badge on the right ── */}
      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums text-ink-primary">
            {value}
          </p>
          {delta && (
            <div className="mt-1 flex items-center gap-1 text-[11px]">
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 font-semibold',
                  delta.direction === 'up' ? 'text-brand-700' : 'text-state-error',
                )}
              >
                {delta.direction === 'up' ? (
                  <ArrowUpRight className="size-3" aria-hidden />
                ) : (
                  <ArrowDownRight className="size-3" aria-hidden />
                )}
                {delta.value}%
              </span>
              {delta.label && <span className="text-ink-muted truncate">{delta.label}</span>}
            </div>
          )}
        </div>

        {icon && (
          /* Icon badge: size-8.5 fits cleanly beside the value without crowding */
          <span
            className={cn(
              'grid size-8 sm:size-9 shrink-0 place-items-center rounded-chip shadow-xs',
              'transition-transform duration-150 hover:scale-105',
              ICON_TONE[tone],
            )}
            aria-hidden
          >
            {icon}
          </span>
        )}
      </div>
    </Card>
  );
}


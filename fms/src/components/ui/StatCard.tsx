import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Card } from '@/components/ui/Card';

/** style.md §6.2 — compact stat tile used across the Operations Dashboard (FR8). */

export type StatTone = 'default' | 'success' | 'warning' | 'info' | 'error';

const ICON_TONE: Record<StatTone, string> = {
  default: 'bg-gray-100 text-ink-secondary',
  success: 'bg-brand-100 text-brand-700',
  warning: 'bg-amber-100 text-amber-700',
  info: 'bg-blue-100 text-blue-700',
  error: 'bg-red-100 text-red-700',
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
    <Card flush className={cn('p-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-ink-secondary">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums text-ink-primary">
            {value}
          </p>
        </div>
        {icon && (
          <span
            className={cn(
              'grid size-9 shrink-0 place-items-center rounded-chip',
              ICON_TONE[tone],
            )}
            aria-hidden
          >
            {icon}
          </span>
        )}
      </div>

      {delta && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              'inline-flex items-center gap-0.5 font-medium',
              delta.direction === 'up' ? 'text-brand-700' : 'text-state-error',
            )}
          >
            {delta.direction === 'up' ? (
              <ArrowUpRight className="size-3.5" aria-hidden />
            ) : (
              <ArrowDownRight className="size-3.5" aria-hidden />
            )}
            {delta.value}%
          </span>
          {delta.label && <span className="text-ink-muted">{delta.label}</span>}
        </div>
      )}
    </Card>
  );
}

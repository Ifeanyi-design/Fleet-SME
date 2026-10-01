import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** style.md §6.7 — empty state: size-12 circle icon + muted copy. */

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      {icon && (
        <span
          className="mb-4 grid size-12 place-items-center rounded-full bg-slate-100 text-ink-secondary"
          aria-hidden
        >
          {icon}
        </span>
      )}
      <p className="text-sm font-semibold text-ink-primary">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-ink-secondary">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

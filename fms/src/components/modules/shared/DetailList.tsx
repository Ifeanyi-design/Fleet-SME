import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Label/value grid used by the vehicle and driver detail summary cards. */

export interface DetailItem {
  label: string;
  value: ReactNode;
}

export interface DetailListProps {
  items: DetailItem[];
  columns?: 2 | 3;
  className?: string;
}

export function DetailList({ items, columns = 2, className }: DetailListProps) {
  return (
    <dl
      className={cn(
        'grid gap-x-6 gap-y-4',
        columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2',
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            {item.label}
          </dt>
          <dd className="mt-1 text-sm text-ink-primary">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

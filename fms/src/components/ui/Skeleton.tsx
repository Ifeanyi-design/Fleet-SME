import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/** style.md §7.2 — skeleton loaders mirror the final geometry. */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-[8px] bg-slate-100/90', className)}
      aria-hidden
      {...props}
    />
  );
}



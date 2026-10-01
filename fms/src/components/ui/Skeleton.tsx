import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/** style.md §7.2 — skeleton loaders mirror the final geometry. */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-100', className)}
      aria-hidden
      {...props}
    />
  );
}

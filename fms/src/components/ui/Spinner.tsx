import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SpinnerProps {
  className?: string;
  label?: string;
}

export function Spinner({ className, label = 'Loading' }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className="inline-flex">
      <Loader2 className={cn('size-5 animate-spin text-ink-muted', className)} aria-hidden />
    </span>
  );
}

/** Full-panel loading state for route/content areas. */
export function FullPageSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="grid min-h-[40vh] place-items-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="size-6 animate-spin text-brand-600" aria-hidden />
        <p className="text-sm text-ink-secondary">{label}</p>
      </div>
    </div>
  );
}

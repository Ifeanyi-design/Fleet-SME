import { Check } from 'lucide-react';
import type { TrackingEvent } from '@/types/domain';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/formatters';

/** FR9 — vertical status timeline for the public tracking page. */

const DOT_TONE: Record<string, string> = {
  pending: 'bg-amber-500',
  in_progress: 'bg-blue-500',
  delivered: 'bg-brand-600',
  cancelled: 'bg-gray-400',
};

export interface TrackingTimelineProps {
  events: TrackingEvent[];
}

export function TrackingTimeline({ events }: TrackingTimelineProps) {
  return (
    <ol className="relative">
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        return (
          <li key={`${event.status}-${index}`} className="relative flex gap-4 pb-6 last:pb-0">
            {/* connector */}
            {!isLast && (
              <span
                className={cn(
                  'absolute left-[11px] top-6 h-full w-0.5',
                  event.done ? 'bg-brand-200' : 'bg-hairline-strong',
                )}
                aria-hidden
              />
            )}

            <span
              className={cn(
                'relative z-10 mt-0.5 grid size-6 shrink-0 place-items-center rounded-full shadow-xs ring-4 ring-white',
                event.done ? DOT_TONE[event.status] ?? 'bg-brand-600' : 'border border-hairline-strong bg-slate-50',
              )}
              aria-hidden
            >
              {event.done && <Check className="size-3 text-white stroke-[2.5]" />}
            </span>

            <div className="min-w-0 flex-1 pt-0.5">
              <p
                className={cn(
                  'text-sm tracking-tight',
                  event.done ? 'font-bold text-ink-primary' : 'font-medium text-ink-muted',
                )}
              >
                {event.label}
              </p>
              <p className="mt-0.5 text-xs tabular-nums text-ink-secondary">
                {event.at ? formatDateTime(event.at) : event.done ? 'Completed' : 'Pending'}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}


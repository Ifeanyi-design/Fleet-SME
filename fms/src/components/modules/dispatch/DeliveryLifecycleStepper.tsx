import { Check } from 'lucide-react';
import type { DeliveryStatus } from '@/types/domain';
import { cn } from '@/lib/cn';

/** Delivery lifecycle indicator (PRD Figure 3.13 state machine). */

const STEPS: { status: DeliveryStatus; label: string }[] = [
  { status: 'pending', label: 'Pending' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'delivered', label: 'Delivered' },
];

export function DeliveryLifecycleStepper({ status }: { status: DeliveryStatus }) {
  if (status === 'cancelled') {
    return (
      <span className="inline-flex items-center gap-2 text-[13px] text-ink-muted">
        <span className="size-1.5 rounded-full bg-gray-400" aria-hidden />
        Cancelled — no further transitions
      </span>
    );
  }

  const activeIndex = STEPS.findIndex((step) => step.status === status);

  return (
    <ol className="flex items-center gap-1.5" aria-label="Delivery lifecycle">
      {STEPS.map((step, index) => {
        const done = index < activeIndex;
        const current = index === activeIndex;
        return (
          <li key={step.status} className="flex items-center gap-1.5">
            {index > 0 && (
              <span
                className={cn('h-px w-4', done || current ? 'bg-brand-500' : 'bg-hairline-strong')}
                aria-hidden
              />
            )}
            <span className="inline-flex items-center gap-1.5">
              <span
                className={cn(
                  'grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold',
                  done && 'bg-brand-600 text-white',
                  current && 'bg-brand-600 text-white ring-4 ring-brand-500/20',
                  !done && !current && 'border border-hairline-strong bg-white text-ink-muted',
                )}
                aria-hidden
              >
                {done ? <Check className="size-3" /> : index + 1}
              </span>
              <span
                className={cn(
                  'text-[13px]',
                  current ? 'font-semibold text-ink-primary' : 'text-ink-secondary',
                )}
              >
                {step.label}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

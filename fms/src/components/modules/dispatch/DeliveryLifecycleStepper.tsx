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
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-ink-muted">
        <span className="size-1.5 rounded-full bg-gray-400" aria-hidden />
        Cancelled
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
                className={cn('h-[2px] w-3 rounded-full', done || current ? 'bg-brand-500' : 'bg-hairline-strong')}
                aria-hidden
              />
            )}
            <span className="inline-flex items-center gap-1">
              <span
                className={cn(
                  'grid size-4.5 shrink-0 place-items-center rounded-full text-[10px] font-bold transition-all shadow-xs',
                  done && 'bg-brand-600 text-white',
                  current && 'bg-brand-600 text-white ring-3 ring-brand-500/25',
                  !done && !current && 'border border-hairline-strong bg-slate-50 text-ink-muted',
                )}
                aria-hidden
              >
                {done ? <Check className="size-2.5 stroke-[2.5]" /> : index + 1}
              </span>
              <span
                className={cn(
                  'text-[12px] tracking-tight',
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


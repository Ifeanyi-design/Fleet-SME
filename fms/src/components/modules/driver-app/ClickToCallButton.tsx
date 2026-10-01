import { Phone } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Click-to-call affordance for the driver app (NFR7 — no data-heavy map needed). */

export interface ClickToCallButtonProps {
  phoneNumber: string;
  label?: string;
  className?: string;
}

export function ClickToCallButton({ phoneNumber, label, className }: ClickToCallButtonProps) {
  return (
    <a
      href={`tel:${phoneNumber}`}
      className={cn(
        'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-control border border-hairline-strong bg-white px-4 text-sm font-medium text-ink-body shadow-xs transition-colors duration-150 hover:bg-surface-hover',
        className,
      )}
    >
      <Phone className="size-4" aria-hidden />
      {label ?? 'Call recipient'}
    </a>
  );
}

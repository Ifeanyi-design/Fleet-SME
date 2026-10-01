import { AlertTriangle, CalendarCheck, CalendarX } from 'lucide-react';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { formatDate, daysUntil } from '@/lib/formatters';

/**
 * Driver licence compliance badge (FR2).
 * State is computed from the expiry date — never stored, so it can't drift:
 *   expired (red) · expiring within 30 days (amber) · valid (green).
 */

const EXPIRING_WINDOW_DAYS = 30;

export interface LicenceExpiryBadgeProps {
  expiryDate: string;
  /** Show the absolute date alongside the relative state. */
  showDate?: boolean;
}

export function LicenceExpiryBadge({ expiryDate, showDate = false }: LicenceExpiryBadgeProps) {
  const daysLeft = daysUntil(expiryDate);

  let variant: BadgeVariant = 'success';
  let label = 'Valid';
  let Icon = CalendarCheck;

  if (daysLeft < 0) {
    variant = 'error';
    label = `Expired ${Math.abs(daysLeft)}d ago`;
    Icon = CalendarX;
  } else if (daysLeft <= EXPIRING_WINDOW_DAYS) {
    variant = 'warning';
    label = daysLeft === 0 ? 'Expires today' : `Expires in ${daysLeft}d`;
    Icon = AlertTriangle;
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge variant={variant}>
        <Icon className="size-3" aria-hidden />
        {label}
      </Badge>
      {showDate && <span className="text-[11px] tabular-nums text-ink-muted">{formatDate(expiryDate)}</span>}
    </span>
  );
}


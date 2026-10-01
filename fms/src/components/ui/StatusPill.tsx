import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import type { DeliveryStatus, DriverStatus, VehicleStatus } from '@/types/domain';

/**
 * style.md §6.4 + plan.md §4.1 — the single source of truth mapping domain status
 * to a badge variant. Colour is never the only signal: every pill carries a label.
 */

type AnyStatus = DeliveryStatus | VehicleStatus | DriverStatus;

const CONFIG: Record<AnyStatus, { label: string; variant: BadgeVariant }> = {
  // DELIVERY
  pending: { label: 'Pending', variant: 'warning' },
  in_progress: { label: 'In Progress', variant: 'info' },
  delivered: { label: 'Delivered', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'neutral' },
  // VEHICLE
  available: { label: 'Available', variant: 'success' },
  on_delivery: { label: 'On Delivery', variant: 'info' },
  in_maintenance: { label: 'In Maintenance', variant: 'error' },
  retired: { label: 'Retired', variant: 'neutral' },
  // DRIVER
  off_duty: { label: 'Off Duty', variant: 'neutral' },
};

export interface StatusPillProps {
  status: AnyStatus;
  dot?: boolean;
  className?: string;
}

export function StatusPill({ status, dot = true, className }: StatusPillProps) {
  const config = CONFIG[status];
  return (
    <Badge variant={config.variant} dot={dot} className={className}>
      {config.label}
    </Badge>
  );
}

/** Human label for a status, without rendering a pill. */
export function statusLabel(status: AnyStatus): string {
  return CONFIG[status].label;
}

import { ChevronRight, MapPin, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DeliveryDetail } from '@/types/domain';
import { timeAgo } from '@/lib/formatters';
import { Card } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { StatusAdvanceButtons } from '@/components/modules/driver-app/StatusAdvanceButtons';
import { ClickToCallButton } from '@/components/modules/driver-app/ClickToCallButton';

/** Driver app — a single assigned waybill (PRD Table 3.6 row 6). */

export interface AssignmentCardProps {
  delivery: DeliveryDetail;
  /** Show one-touch completion controls (used on the active list). */
  showActions?: boolean;
}

export function AssignmentCard({ delivery, showActions = false }: AssignmentCardProps) {
  const recipientPhone = delivery.customer?.phone ?? '';

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold text-ink-primary">
            {delivery.trackingCode}
          </p>
          <p className="mt-0.5 truncate text-[13px] text-ink-secondary">
            {delivery.customer?.name ?? 'Unknown customer'}
          </p>
        </div>
        <StatusPill status={delivery.status} />
      </div>

      <dl className="mt-3.5 space-y-2 border-t border-hairline pt-3.5 text-[13px]">
        <div className="flex gap-2">
          <dt className="w-[4.5rem] shrink-0 text-ink-muted">Pickup</dt>
          <dd className="text-ink-body">{delivery.pickupAddress}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-[4.5rem] shrink-0 text-ink-muted">Drop-off</dt>
          <dd className="text-ink-body">{delivery.dropoffAddress}</dd>
        </div>
      </dl>

      {delivery.items.length > 0 && (
        <ul className="mt-3 space-y-1.5 rounded-chip bg-surface-sunken px-3 py-2.5">
          {delivery.items.map((item) => (
            <li
              key={item.productId}
              className="flex items-center justify-between gap-3 text-xs text-ink-secondary"
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <Package className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{item.product?.productName ?? 'Item'}</span>
              </span>
              <span className="shrink-0 tabular-nums">×{item.quantity}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-hairline pt-3.5">
        <span className="flex items-center gap-1.5 text-[11px] text-ink-muted">
          <MapPin className="size-3.5" aria-hidden />
          {timeAgo(delivery.dateCreated)}
        </span>
        <Link
          to={`/driver/trips/${delivery.deliveryId}`}
          className="inline-flex items-center gap-0.5 text-[13px] font-medium text-brand-700 transition-colors hover:text-brand-800"
        >
          Waybill
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>

      {showActions && delivery.status === 'in_progress' && (
        <div className="mt-4 space-y-2.5 border-t border-hairline pt-4">
          {recipientPhone && <ClickToCallButton phoneNumber={recipientPhone} className="w-full" />}
          <StatusAdvanceButtons delivery={delivery} />
        </div>
      )}
    </Card>
  );
}

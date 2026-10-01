import { Inbox, MapPin } from 'lucide-react';
import type { DeliveryDetail } from '@/types/domain';
import { cn } from '@/lib/cn';
import { timeAgo } from '@/lib/formatters';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

/** FR4 — queue of unallocated (Pending) delivery orders. */

export interface PendingOrderQueueProps {
  deliveries: DeliveryDetail[];
  loading?: boolean;
  selectedId: number | null;
  onSelect: (delivery: DeliveryDetail) => void;
}

export function PendingOrderQueue({
  deliveries,
  loading = false,
  selectedId,
  onSelect,
}: PendingOrderQueueProps) {
  return (
    <Card flush className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-4">
        <div>
          <h2 className="text-base font-semibold tracking-[-0.01em] text-ink-primary">
            Pending orders
          </h2>
          <p className="text-[13px] text-ink-secondary">Awaiting allocation</p>
        </div>
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold tabular-nums text-amber-700">
          {deliveries.length}
        </span>
      </div>

      {loading ? (
        <div className="space-y-2.5 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : deliveries.length === 0 ? (
        <EmptyState
          icon={<Inbox className="size-6" />}
          title="No pending orders"
          description="New waybills will appear here for allocation."
        />
      ) : (
        <ul className="max-h-[30rem] flex-1 space-y-2 overflow-y-auto p-3">
          {deliveries.map((delivery) => {
            const selected = delivery.deliveryId === selectedId;
            return (
              <li key={delivery.deliveryId}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onSelect(delivery)}
                  className={cn(
                    'w-full rounded-control border p-3.5 text-left transition-colors duration-150',
                    selected
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-hairline bg-white hover:border-hairline-hover hover:bg-surface-hover',
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[13px] font-semibold text-ink-primary">
                      {delivery.trackingCode}
                    </span>
                    <span className="text-[11px] tabular-nums text-ink-muted">
                      {timeAgo(delivery.dateCreated)}
                    </span>
                  </div>
                  <p className="mt-1.5 truncate text-[13px] font-medium text-ink-body">
                    {delivery.customer?.name ?? 'Unknown customer'}
                  </p>
                  <p className="mt-0.5 flex items-start gap-1.5 text-xs text-ink-secondary">
                    <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    <span className="truncate">{delivery.dropoffAddress}</span>
                  </p>
                  <p className="mt-1.5 text-[11px] text-ink-muted">
                    {delivery.items.length} line {delivery.items.length === 1 ? 'item' : 'items'}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

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
      <div className="flex items-center justify-between gap-3 border-b border-hairline bg-slate-50/60 px-5 py-3.5">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-ink-primary">
            Pending orders
          </h2>
          <p className="text-xs text-ink-secondary">Awaiting vehicle & driver</p>
        </div>
        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-amber-700 ring-1 ring-inset ring-amber-600/20 shadow-xs">
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
          icon={<Inbox className="size-5" />}
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
                    'w-full rounded-control border p-3.5 text-left transition-all duration-150 ease-out shadow-xs',
                    selected
                      ? 'border-brand-500 bg-brand-50/40 border-l-4 border-l-brand-600 shadow-sm ring-1 ring-brand-500/20'
                      : 'border-hairline bg-white hover:border-hairline-strong hover:bg-slate-50/80 hover:shadow-sm',
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[12px] font-bold tracking-tight text-ink-primary">
                      {delivery.trackingCode}
                    </span>
                    <span className="text-[11px] tabular-nums text-ink-muted">
                      {timeAgo(delivery.dateCreated)}
                    </span>
                  </div>
                  <p className="mt-1.5 truncate text-[13px] font-semibold text-ink-primary">
                    {delivery.customer?.name ?? 'Unknown customer'}
                  </p>
                  <p className="mt-0.5 flex items-start gap-1.5 text-xs text-ink-secondary">
                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-ink-muted" aria-hidden />
                    <span className="truncate">{delivery.dropoffAddress}</span>
                  </p>
                  <div className="mt-2 flex items-center justify-between border-t border-hairline/60 pt-2 text-[11px] text-ink-muted">
                    <span>{delivery.items.length} line {delivery.items.length === 1 ? 'item' : 'items'}</span>
                    <span className="font-medium text-brand-700">Assign now →</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}


import { useMemo, useState } from 'react';
import { History, Link2Off } from 'lucide-react';
import type { DeliveryStatus } from '@/types/domain';
import { useDriverId } from '@/context/AuthContext';
import { useDeliveriesForDriver } from '@/hooks/useDeliveries';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { FilterChips, type FilterOption } from '@/components/modules/shared/FilterBar';
import { AssignmentCard } from '@/components/modules/driver-app/AssignmentCard';

/** Driver history — completed and cancelled waybills (FR5 trail). */

type HistoryFilter = 'all' | Extract<DeliveryStatus, 'delivered' | 'cancelled'>;

const FILTERS: FilterOption<HistoryFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function DriverHistory() {
  const driverId = useDriverId();
  const [filter, setFilter] = useState<HistoryFilter>('all');

  const query = useDeliveriesForDriver(driverId);

  const closed = useMemo(
    () => (query.data ?? []).filter((d) => d.status === 'delivered' || d.status === 'cancelled'),
    [query.data],
  );

  const visible = useMemo(
    () => (filter === 'all' ? closed : closed.filter((d) => d.status === filter)),
    [closed, filter],
  );

  const deliveredCount = closed.filter((d) => d.status === 'delivered').length;
  const cancelledCount = closed.length - deliveredCount;

  const options = FILTERS.map((option) => ({
    ...option,
    count:
      option.value === 'all'
        ? closed.length
        : option.value === 'delivered'
          ? deliveredCount
          : cancelledCount,
  }));

  if (driverId === null) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold tracking-tight text-ink-primary">Delivery history</h1>
        <Card flush>
          <EmptyState
            icon={<Link2Off className="size-6" />}
            title="Account not linked to a rider"
            description="This login is not attached to a driver record yet."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink-primary">Delivery history</h1>
        <p className="mt-0.5 text-[13px] text-ink-secondary">
          {deliveredCount} delivered · {cancelledCount} cancelled
        </p>
      </div>

      <FilterChips options={options} value={filter} onChange={setFilter} />

      {query.isLoading ? (
        <>
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
        </>
      ) : query.isError ? (
        <ErrorState
          title="Could not load your history"
          description="Check your connection and try again."
          onRetry={() => void query.refetch()}
        />
      ) : visible.length === 0 ? (
        <Card flush>
          <EmptyState
            icon={<History className="size-6" />}
            title={closed.length === 0 ? 'No completed deliveries yet' : 'Nothing in this filter'}
            description={
              closed.length === 0
                ? 'Delivered and cancelled waybills will be listed here.'
                : 'Try a different filter to see other waybills.'
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((delivery) => (
            <AssignmentCard key={delivery.deliveryId} delivery={delivery} />
          ))}
        </div>
      )}
    </div>
  );
}

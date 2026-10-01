import type { DeliveryDetail } from '@/types/domain';
import { timeAgo } from '@/lib/formatters';
import { StatusPill } from '@/components/ui/StatusPill';
import { DataTable, type Column } from '@/components/modules/shared/DataTable';

/** FR8 — recent deliveries strip on the Operations Dashboard (plan.md §2.2). */

export interface RecentDeliveriesTableProps {
  deliveries: DeliveryDetail[];
  loading?: boolean;
}

export function RecentDeliveriesTable({ deliveries, loading = false }: RecentDeliveriesTableProps) {
  const columns: Column<DeliveryDetail>[] = [
    {
      key: 'tracking',
      header: 'Waybill',
      cell: (d) => (
        <span className="font-mono text-[13px] font-medium text-ink-primary">{d.trackingCode}</span>
      ),
      mobileLabel: 'Waybill',
    },
    {
      key: 'customer',
      header: 'Customer',
      cell: (d) => (
        <div className="min-w-0">
          <p className="truncate text-sm text-ink-primary">{d.customer?.name ?? '—'}</p>
          <p className="truncate text-xs text-ink-muted">{d.dropoffAddress}</p>
        </div>
      ),
      mobileLabel: 'Customer',
    },
    {
      key: 'driver',
      header: 'Driver',
      cell: (d) => (
        <span className="text-[13px] text-ink-body">{d.driver?.fullName ?? 'Unassigned'}</span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (d) => <StatusPill status={d.status} />,
    },
    {
      key: 'created',
      header: 'Created',
      align: 'right',
      cell: (d) => <span className="text-xs tabular-nums text-ink-muted">{timeAgo(d.dateCreated)}</span>,
      hideOnMobile: true,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={deliveries}
      keyOf={(d) => d.deliveryId}
      loading={loading}
      skeletonRows={5}
      emptyTitle="No deliveries yet"
      emptyDescription="Dispatched waybills will appear here as soon as they are created."
    />
  );
}

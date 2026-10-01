import type { DeliveryDetail } from '@/types/domain';
import { formatDateTime } from '@/lib/formatters';
import { StatusPill } from '@/components/ui/StatusPill';
import { DataTable, type Column } from '@/components/modules/shared/DataTable';

/** FR8 — the exportable deliveries report table. */

export interface DeliveriesReportTableProps {
  rows: DeliveryDetail[];
  loading?: boolean;
  pageSize?: number;
}

export function DeliveriesReportTable({
  rows,
  loading = false,
  pageSize = 15,
}: DeliveriesReportTableProps) {
  const columns: Column<DeliveryDetail>[] = [
    {
      key: 'waybill',
      header: 'Waybill',
      cell: (d) => (
        <span className="font-mono text-[13px] font-medium text-ink-primary">{d.trackingCode}</span>
      ),
      mobileLabel: 'Waybill',
    },
    {
      key: 'created',
      header: 'Created',
      cell: (d) => (
        <span className="text-[13px] tabular-nums text-ink-body">{formatDateTime(d.dateCreated)}</span>
      ),
      mobileLabel: 'Created',
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
      key: 'vehicle',
      header: 'Vehicle',
      cell: (d) => (
        <span className="font-mono text-[13px] text-ink-body">
          {d.vehicle?.registrationNumber ?? '—'}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'items',
      header: 'Items',
      align: 'right',
      cell: (d) => (
        <span className="text-[13px] tabular-nums text-ink-body">
          {d.items.reduce((sum, item) => sum + item.quantity, 0)}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (d) => <StatusPill status={d.status} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      keyOf={(d) => d.deliveryId}
      loading={loading}
      pageSize={pageSize}
      ariaLabel="Deliveries report"
      emptyTitle="No deliveries match these filters"
      emptyDescription="Widen the date range or clear a filter to see results."
    />
  );
}

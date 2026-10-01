import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { MaintenanceRow } from '@/lib/mockApi';
import { daysUntil, formatCurrency, formatDate, formatNumber } from '@/lib/formatters';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/modules/shared/DataTable';

/** FR6 — maintenance log datatable (plan.md §2.7). */

/** Next-service indicator derived from NextDueDate (Figure 3.14 logic). */
function ServiceDueCell({ nextDueDate }: { nextDueDate: string }) {
  const daysLeft = daysUntil(nextDueDate);
  if (daysLeft < 0) {
    return (
      <Badge variant="error">
        <AlertTriangle className="size-3.5" aria-hidden />
        Overdue {Math.abs(daysLeft)}d
      </Badge>
    );
  }
  if (daysLeft <= 14) {
    return (
      <Badge variant="warning">
        <AlertTriangle className="size-3.5" aria-hidden />
        Due in {daysLeft}d
      </Badge>
    );
  }
  return (
    <Badge variant="success">
      <CheckCircle2 className="size-3.5" aria-hidden />
      {formatDate(nextDueDate)}
    </Badge>
  );
}

export interface MaintenanceLogTableProps {
  logs: MaintenanceRow[];
  loading?: boolean;
  pageSize?: number;
  /** Hide the vehicle column (used on the vehicle detail page). */
  hideVehicle?: boolean;
}

export function MaintenanceLogTable({
  logs,
  loading = false,
  pageSize,
  hideVehicle = false,
}: MaintenanceLogTableProps) {
  const columns: Column<MaintenanceRow>[] = [
    {
      key: 'vehicle',
      header: 'Vehicle',
      cell: (row) => (
        <div className="min-w-0">
          <p className="font-mono text-[13px] font-medium text-ink-primary">
            {row.vehicle?.registrationNumber ?? `#${row.vehicleId}`}
          </p>
          <p className="truncate text-xs text-ink-muted">
            {row.vehicle ? `${row.vehicle.make} ${row.vehicle.model}` : '—'}
          </p>
        </div>
      ),
      hideOnMobile: hideVehicle,
      mobileLabel: 'Vehicle',
    },
    {
      key: 'serviceDate',
      header: 'Service date',
      cell: (row) => (
        <span className="text-[13px] tabular-nums text-ink-body">{formatDate(row.serviceDate)}</span>
      ),
      mobileLabel: 'Service date',
    },
    {
      key: 'odometer',
      header: 'Odometer',
      align: 'right',
      cell: (row) => (
        <span className="text-[13px] tabular-nums text-ink-body">
          {row.odometer === null ? '—' : `${formatNumber(row.odometer)} km`}
        </span>
      ),
      mobileLabel: 'Odometer',
    },
    {
      key: 'description',
      header: 'Work description',
      cell: (row) => <span className="text-[13px] text-ink-body">{row.description}</span>,
      mobileLabel: 'Work',
    },
    {
      key: 'cost',
      header: 'Cost',
      align: 'right',
      cell: (row) => (
        <span className="text-[13px] font-medium tabular-nums text-ink-primary">
          {formatCurrency(row.cost)}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'nextDue',
      header: 'Next service',
      cell: (row) => <ServiceDueCell nextDueDate={row.nextDueDate} />,
      mobileLabel: 'Next service',
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={logs}
      keyOf={(row) => row.maintenanceId}
      loading={loading}
      pageSize={pageSize}
      emptyTitle="No maintenance records"
      emptyDescription="Service events logged against your vehicles will appear here."
    />
  );
}

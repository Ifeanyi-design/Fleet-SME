import { Eye, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Vehicle } from '@/types/domain';
import { formatNumber } from '@/lib/formatters';
import { vehicleTypeLabel } from '@/lib/labels';
import { IconButton } from '@/components/ui/IconButton';
import { DataTable, type Column } from '@/components/modules/shared/DataTable';
import { VehicleStatusToggle } from '@/components/modules/vehicles/VehicleStatusToggle';

/** FR1 — vehicle asset datatable (plan.md §2.3). */

export interface VehicleTableProps {
  vehicles: Vehicle[];
  loading?: boolean;
  pageSize?: number;
  /** FR1 — open the modify dialog for a row. */
  onEdit?: (vehicle: Vehicle) => void;
}

export function VehicleTable({
  vehicles,
  loading = false,
  pageSize,
  onEdit,
}: VehicleTableProps) {
  const navigate = useNavigate();

  const columns: Column<Vehicle>[] = [
    {
      key: 'reg',
      header: 'Registration',
      cell: (v) => <span className="font-mono text-[13px] font-medium text-ink-primary">{v.registrationNumber}</span>,
      mobileLabel: 'Registration',
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      cell: (v) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink-primary">{v.make}</p>
          <p className="truncate text-xs text-ink-muted">{v.model}</p>
        </div>
      ),
      mobileLabel: 'Vehicle',
    },
    {
      key: 'type',
      header: 'Type',
      cell: (v) => <span className="text-[13px] text-ink-body">{vehicleTypeLabel(v.vehicleType)}</span>,
    },
    {
      key: 'odometer',
      header: 'Odometer',
      align: 'right',
      cell: (v) => (
        <span className="text-[13px] tabular-nums text-ink-body">{formatNumber(v.odometer)} km</span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (v) => <VehicleStatusToggle vehicle={v} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={vehicles}
      keyOf={(v) => v.vehicleId}
      loading={loading}
      pageSize={pageSize}
      onRowClick={(v) => navigate(`/vehicles/${v.vehicleId}`)}
      emptyTitle="No vehicles match your filters"
      emptyDescription="Adjust the search or status filter, or register a new vehicle."
      rowActions={(v) => (
        <>
          {onEdit && (
            <IconButton
              label={`Edit ${v.registrationNumber}`}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(v);
              }}
            >
              <Pencil className="size-4" />
            </IconButton>
          )}
          <IconButton
            label={`View ${v.registrationNumber}`}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/vehicles/${v.vehicleId}`);
            }}
          >
            <Eye className="size-4" />
          </IconButton>
        </>
      )}
    />
  );
}

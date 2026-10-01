import { Pencil, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Driver } from '@/types/domain';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/IconButton';
import { DataTable, type Column } from '@/components/modules/shared/DataTable';
import { LicenceExpiryBadge } from '@/components/modules/drivers/LicenceExpiryBadge';
import { DriverStatusToggle } from '@/components/modules/drivers/DriverStatusToggle';

/** FR2 — driver roster datatable (plan.md §2.4). */

export interface DriverRosterTableProps {
  drivers: Driver[];
  loading?: boolean;
  pageSize?: number;
  /** FR2 — open the update dialog for a row. */
  onEdit?: (driver: Driver) => void;
}

export function DriverRosterTable({
  drivers,
  loading = false,
  pageSize,
  onEdit,
}: DriverRosterTableProps) {
  const navigate = useNavigate();

  const columns: Column<Driver>[] = [
    {
      key: 'name',
      header: 'Driver',
      cell: (d) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={d.fullName} size="sm" />
          <span className="truncate text-sm font-medium text-ink-primary">{d.fullName}</span>
        </div>
      ),
      mobileLabel: 'Driver',
    },
    {
      key: 'phone',
      header: 'Phone',
      cell: (d) => (
        <a
          href={`tel:${d.phoneNumber}`}
          onClick={(e) => e.stopPropagation()}
          className="text-[13px] tabular-nums text-brand-700 transition-colors hover:text-brand-800 hover:underline"
        >
          {d.phoneNumber}
        </a>
      ),
      mobileLabel: 'Phone',
    },
    {
      key: 'licence',
      header: 'Licence no.',
      cell: (d) => <span className="font-mono text-[13px] text-ink-body">{d.licenseNumber}</span>,
      hideOnMobile: true,
    },
    {
      key: 'expiry',
      header: 'Licence expiry',
      cell: (d) => <LicenceExpiryBadge expiryDate={d.licenseExpiryDate} />,
      mobileLabel: 'Licence',
    },
    {
      key: 'status',
      header: 'Status',
      cell: (d) => <DriverStatusToggle driver={d} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={drivers}
      keyOf={(d) => d.driverId}
      loading={loading}
      pageSize={pageSize}
      onRowClick={(d) => navigate(`/drivers/${d.driverId}`)}
      emptyTitle="No drivers match your filters"
      emptyDescription="Adjust the search or status filter, or enrol a new driver."
      rowActions={(d) => (
        <>
          {onEdit && (
            <IconButton
              label={`Edit ${d.fullName}`}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(d);
              }}
            >
              <Pencil className="size-4" />
            </IconButton>
          )}
          <IconButton
            label={`Call ${d.fullName}`}
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `tel:${d.phoneNumber}`;
            }}
          >
            <Phone className="size-4" />
          </IconButton>
        </>
      )}
    />
  );
}

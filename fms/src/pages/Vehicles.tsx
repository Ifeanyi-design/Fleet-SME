import { useMemo, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import type { Vehicle, VehicleStatus, VehicleType } from '@/types/domain';
import { useDebounce } from '@/hooks/useDebounce';
import { useVehicles } from '@/hooks/useVehicles';
import { PageHeader } from '@/components/layouts/PageHeader';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  FilterBar,
  FilterChips,
  type FilterOption,
} from '@/components/modules/shared/FilterBar';
import { VehicleTable } from '@/components/modules/vehicles/VehicleTable';
import { VehicleFormDialog } from '@/components/modules/vehicles/VehicleFormDialog';

/** Vehicle Asset Console — PRD Table 3.6 row 3, FR1 (read). */

type StatusFilter = VehicleStatus | 'all';
type TypeFilter = VehicleType | 'all';

const STATUS_OPTIONS: FilterOption<StatusFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'available', label: 'Available' },
  { value: 'on_delivery', label: 'On Delivery' },
  { value: 'in_maintenance', label: 'In Maintenance' },
  { value: 'retired', label: 'Retired' },
];

const TYPE_OPTIONS: FilterOption<TypeFilter>[] = [
  { value: 'all', label: 'All types' },
  { value: 'bike', label: 'Bikes' },
  { value: 'trike', label: 'Trikes' },
  { value: 'van', label: 'Vans' },
];

export function Vehicles() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [type, setType] = useState<TypeFilter>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const filters = useMemo(
    () => ({ search: debouncedSearch, status, type }),
    [debouncedSearch, status, type],
  );

  const query = useVehicles(filters);

  return (
    <>
      <PageHeader
        title="Vehicle Asset Console"
        description="Register, inspect, and track the operational status of every vehicle in the fleet."
        breadcrumbs={[{ label: 'Fleet' }, { label: 'Vehicles' }]}
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<RefreshCw className="size-4" />}
              onClick={() => query.refetch()}
              disabled={query.isFetching}
            >
              Refresh
            </Button>
            <Button
              leftIcon={<Plus className="size-4" />}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              Register New Vehicle
            </Button>
          </>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search registration, make or model…"
      >
        <FilterChips options={TYPE_OPTIONS} value={type} onChange={setType} />
        <span className="hidden h-5 w-px bg-hairline-strong lg:block" aria-hidden />
        <FilterChips options={STATUS_OPTIONS} value={status} onChange={setStatus} />
      </FilterBar>

      {query.isError ? (
        <ErrorState
          title="Could not load vehicles"
          onRetry={() => void query.refetch()}
        />
      ) : (
        <VehicleTable
          vehicles={query.data ?? []}
          loading={query.isLoading}
          pageSize={10}
          onEdit={(vehicle) => {
            setEditing(vehicle);
            setFormOpen(true);
          }}
        />
      )}

      <VehicleFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        vehicle={editing}
      />
    </>
  );
}

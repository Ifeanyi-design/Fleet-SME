import { useMemo, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useMaintenance } from '@/hooks/useMaintenance';
import { useVehicles } from '@/hooks/useVehicles';
import { PageHeader } from '@/components/layouts/PageHeader';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Select } from '@/components/ui/Select';
import { FilterBar } from '@/components/modules/shared/FilterBar';
import { MaintenanceLogTable } from '@/components/modules/maintenance/MaintenanceLogTable';
import { MaintenanceSummary } from '@/components/modules/maintenance/MaintenanceSummary';
import { MaintenanceFormDialog } from '@/components/modules/maintenance/MaintenanceFormDialog';

/** Maintenance Logging Screen — PRD Table 3.6 row 7, FR6 (read). */

export function Maintenance() {
  const [search, setSearch] = useState('');
  const [vehicleId, setVehicleId] = useState<number | 'all'>('all');
  const [formOpen, setFormOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 300);
  const vehiclesQuery = useVehicles();

  const filters = useMemo(
    () => ({ search: debouncedSearch, vehicleId }),
    [debouncedSearch, vehicleId],
  );

  const query = useMaintenance(filters);

  const vehicleOptions = useMemo(
    () => [
      { value: 'all', label: 'All vehicles' },
      ...(vehiclesQuery.data ?? []).map((v) => ({
        value: String(v.vehicleId),
        label: `${v.registrationNumber} — ${v.make} ${v.model}`,
      })),
    ],
    [vehiclesQuery.data],
  );

  const logs = query.data ?? [];

  return (
    <>
      <PageHeader
        title="Maintenance Logging"
        description="Record service events, workshop costs, and preventive service schedules."
        breadcrumbs={[{ label: 'Fleet' }, { label: 'Maintenance' }]}
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
            <Button leftIcon={<Plus className="size-4" />} onClick={() => setFormOpen(true)}>
              Log Maintenance
            </Button>
          </>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search work description or vehicle…"
      >
        <div className="w-full sm:w-64">
          <Select
            aria-label="Filter by vehicle"
            options={vehicleOptions}
            value={String(vehicleId)}
            onChange={(e) =>
              setVehicleId(e.target.value === 'all' ? 'all' : Number(e.target.value))
            }
          />
        </div>
      </FilterBar>

      {query.isError ? (
        <ErrorState title="Could not load maintenance records" onRetry={() => void query.refetch()} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <MaintenanceLogTable logs={logs} loading={query.isLoading} pageSize={10} />
          </div>
          <MaintenanceSummary logs={logs} loading={query.isLoading} />
        </div>
      )}

      <MaintenanceFormDialog open={formOpen} onClose={() => setFormOpen(false)} />
    </>
  );
}

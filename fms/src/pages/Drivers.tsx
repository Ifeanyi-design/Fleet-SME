import { useMemo, useState } from 'react';
import { AlertTriangle, Plus, RefreshCw } from 'lucide-react';
import type { Driver, DriverStatus } from '@/types/domain';
import { cn } from '@/lib/cn';
import { isMockData } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import { useDrivers } from '@/hooks/useDrivers';
import { PageHeader } from '@/components/layouts/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  FilterBar,
  FilterChips,
  type FilterOption,
} from '@/components/modules/shared/FilterBar';
import { DriverRosterTable } from '@/components/modules/drivers/DriverRosterTable';
import { DriverFormDialog } from '@/components/modules/drivers/DriverFormDialog';

/** Driver Management Console — PRD Table 3.6 row 4, FR2 (read). */

type StatusFilter = DriverStatus | 'all';

const STATUS_OPTIONS: FilterOption<StatusFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'available', label: 'Available' },
  { value: 'on_delivery', label: 'On Delivery' },
  { value: 'off_duty', label: 'Off Duty' },
];

export function Drivers() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [expiringOnly, setExpiringOnly] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const filters = useMemo(
    () => ({ search: debouncedSearch, status, expiringOnly }),
    [debouncedSearch, status, expiringOnly],
  );

  const query = useDrivers(filters);

  return (
    <>
      <PageHeader
        title="Driver Management Console"
        description="Manage rider rosters, contact records, and statutory licence compliance."
        breadcrumbs={[{ label: 'Fleet' }, { label: 'Drivers' }]}
        actions={
          <>
            {isMockData && <Badge variant="neutral">Demo data</Badge>}
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
              Enroll Driver
            </Button>
          </>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, phone or licence…"
      >
        <button
          type="button"
          aria-pressed={expiringOnly}
          onClick={() => setExpiringOnly((v) => !v)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors duration-150',
            expiringOnly
              ? 'bg-amber-500 text-white'
              : 'border border-hairline-strong bg-white text-ink-secondary hover:bg-surface-hover hover:text-ink-primary',
          )}
        >
          <AlertTriangle className="size-3.5" aria-hidden />
          Licence expiring
        </button>
        <span className="hidden h-5 w-px bg-hairline-strong lg:block" aria-hidden />
        <FilterChips options={STATUS_OPTIONS} value={status} onChange={setStatus} />
      </FilterBar>

      {query.isError ? (
        <ErrorState title="Could not load drivers" onRetry={() => void query.refetch()} />
      ) : (
        <DriverRosterTable
          drivers={query.data ?? []}
          loading={query.isLoading}
          pageSize={10}
          onEdit={(driver) => {
            setEditing(driver);
            setFormOpen(true);
          }}
        />
      )}

      <DriverFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        driver={editing}
      />
    </>
  );
}

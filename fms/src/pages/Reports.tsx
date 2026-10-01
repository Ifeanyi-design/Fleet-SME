import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import type { DeliveryDetail } from '@/types/domain';
import { reportFilename, type CsvColumn } from '@/lib/csv';
import { formatDateTime } from '@/lib/formatters';
import { useDebounce } from '@/hooks/useDebounce';
import { useReport } from '@/hooks/useReports';
import { useDrivers } from '@/hooks/useDrivers';
import { useVehicles } from '@/hooks/useVehicles';
import { PageHeader } from '@/components/layouts/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Card } from '@/components/ui/Card';
import { ExportButton } from '@/components/modules/shared/ExportButton';
import {
  EMPTY_REPORT_FILTERS,
  ReportFilterBar,
  type ReportFilterState,
} from '@/components/modules/reports/ReportFilterBar';
import { ReportSummaryCards } from '@/components/modules/reports/ReportSummaryCards';
import { DeliveriesReportTable } from '@/components/modules/reports/DeliveriesReportTable';

/** Reports — PRD Table 3.6 output design, FR8 (filter + export). */

const CSV_COLUMNS: CsvColumn<DeliveryDetail>[] = [
  { header: 'Waybill', value: (d) => d.trackingCode },
  { header: 'Created', value: (d) => formatDateTime(d.dateCreated) },
  { header: 'Delivered', value: (d) => (d.dateDelivered ? formatDateTime(d.dateDelivered) : '') },
  { header: 'Status', value: (d) => d.status },
  { header: 'Customer', value: (d) => d.customer?.name ?? '' },
  { header: 'Driver', value: (d) => d.driver?.fullName ?? '' },
  { header: 'Vehicle', value: (d) => d.vehicle?.registrationNumber ?? '' },
  { header: 'Pickup', value: (d) => d.pickupAddress },
  { header: 'Drop-off', value: (d) => d.dropoffAddress },
  { header: 'Items', value: (d) => d.items.reduce((sum, item) => sum + item.quantity, 0) },
];

export function Reports() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<ReportFilterState>(EMPTY_REPORT_FILTERS);
  const debouncedSearch = useDebounce(filters.search, 300);

  // The topbar search deep-links here with ?q=… — seed (and re-apply) the filter.
  const queryParam = searchParams.get('q');
  useEffect(() => {
    if (queryParam !== null) {
      setFilters((prev) => ({ ...prev, search: queryParam }));
    }
  }, [queryParam]);

  const vehiclesQuery = useVehicles();
  const driversQuery = useDrivers();

  const reportFilters = useMemo(
    () => ({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch],
  );

  const query = useReport(reportFilters);
  const rows = query.data?.rows ?? [];

  function patch(next: Partial<ReportFilterState>) {
    setFilters((prev) => ({ ...prev, ...next }));
  }

  return (
    <>
      <PageHeader
        title="Reports"
        description="Filter delivery activity by date, vehicle, driver and status — then export it."
        breadcrumbs={[{ label: 'Dispatch' }, { label: 'Reports' }]}
        actions={
          <>
            <ExportButton
              rows={rows}
              columns={CSV_COLUMNS}
              filename={reportFilename('fleet-deliveries-report')}
              disabled={query.isLoading}
            />
          </>
        }
      />

      <ReportFilterBar
        value={filters}
        onChange={patch}
        onReset={() => setFilters(EMPTY_REPORT_FILTERS)}
        vehicles={vehiclesQuery.data ?? []}
        drivers={driversQuery.data ?? []}
      />

      <div className="space-y-6">
        <ReportSummaryCards summary={query.data?.summary} loading={query.isLoading} />

        {query.isError ? (
          <ErrorState title="Could not build the report" onRetry={() => void query.refetch()} />
        ) : !query.isLoading && rows.length === 0 ? (
          <Card flush>
            <EmptyState
              icon={<BarChart3 className="size-6" />}
              title="No deliveries in this window"
              description="Try widening the date range or clearing a filter."
            />
          </Card>
        ) : (
          <DeliveriesReportTable rows={rows} loading={query.isLoading} />
        )}
      </div>
    </>
  );
}

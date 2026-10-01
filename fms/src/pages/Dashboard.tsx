import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { RangeKey } from '@/lib/mockApi';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useDeliveries } from '@/hooks/useDeliveries';
import { PageHeader } from '@/components/layouts/PageHeader';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { SegmentedControl, type SegmentedOption } from '@/components/ui/SegmentedControl';
import { KpiStatRow } from '@/components/modules/dashboard/KpiStatRow';
import { DeliveryTrendChart } from '@/components/modules/dashboard/DeliveryTrendChart';
import { DeliveryStatusDonut } from '@/components/modules/dashboard/DeliveryStatusDonut';
import { CriticalAlertsRail } from '@/components/modules/dashboard/CriticalAlertsRail';
import { DriverRosterPanel } from '@/components/modules/dashboard/DriverRosterPanel';
import { RecentDeliveriesTable } from '@/components/modules/dispatch/RecentDeliveriesTable';

/** Operations Dashboard — PRD Table 3.6 row 2, FR8. */

const RANGE_OPTIONS: SegmentedOption<RangeKey>[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
];

const RANGE_LABEL: Record<RangeKey, string> = {
  '7d': '7 days',
  '30d': '30 days',
  '90d': '90 days',
};

export function Dashboard() {
  const [range, setRange] = useState<RangeKey>('30d');

  const metricsQuery = useDashboardMetrics(range);
  const recentQuery = useDeliveries({ limit: 8 });

  return (
    <>
      <PageHeader
        title="Operations Dashboard"
        description="Real-time visibility across fleet availability, deliveries and maintenance."
        actions={
          <>
            <SegmentedControl
              options={RANGE_OPTIONS}
              value={range}
              onChange={setRange}
              ariaLabel="Reporting range"
            />
          </>
        }
      />

      <div className="space-y-6">
        {metricsQuery.isError ? (
          <ErrorState
            title="Could not load dashboard metrics"
            onRetry={() => void metricsQuery.refetch()}
          />
        ) : (
          <KpiStatRow metrics={metricsQuery.data} loading={metricsQuery.isLoading} />
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DeliveryTrendChart
              trend={metricsQuery.data?.deliveryTrend}
              loading={metricsQuery.isLoading}
              rangeLabel={RANGE_LABEL[range]}
            />
          </div>
          <DeliveryStatusDonut
            counts={metricsQuery.data?.deliveriesByStatus}
            loading={metricsQuery.isLoading}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold tracking-[-0.01em] text-ink-primary">
                  Recent deliveries
                </h2>
                <p className="text-[13px] text-ink-secondary">Latest waybills across the fleet</p>
              </div>
              <Link to="/dispatch">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="size-4" />}>
                  View all
                </Button>
              </Link>
            </div>
            <RecentDeliveriesTable
              deliveries={recentQuery.data ?? []}
              loading={recentQuery.isLoading}
            />
          </section>

          {/* Right rail: alerts + the driver roster badges Table 3.6 asks for. */}
          <div className="space-y-6">
            <CriticalAlertsRail metrics={metricsQuery.data} loading={metricsQuery.isLoading} />
            <DriverRosterPanel metrics={metricsQuery.data} loading={metricsQuery.isLoading} />
          </div>
        </div>
      </div>
    </>
  );
}

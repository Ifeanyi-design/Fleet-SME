import { Activity, CheckCircle2, Navigation, Package, Truck, Wrench } from 'lucide-react';
import type { DashboardMetrics } from '@/types/domain';
import { formatNumber } from '@/lib/formatters';
import { StatCard } from '@/components/ui/StatCard';
import { Skeleton } from '@/components/ui/Skeleton';

/** FR8 — KPI stat row (plan.md §2.2, step 2). */

export interface KpiStatRowProps {
  metrics: DashboardMetrics | undefined;
  loading?: boolean;
}

const GRID = 'grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6';

export function KpiStatRow({ metrics, loading = false }: KpiStatRowProps) {
  if (loading || !metrics) {
    return (
      <div className={GRID}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col justify-between rounded-card border border-hairline bg-surface p-4 shadow-card">
            <Skeleton className="h-3.5 w-24" />
            <div className="mt-3 flex items-end justify-between">
              <Skeleton className="h-7 w-12" />
              <Skeleton className="size-8 rounded-chip" />
            </div>
          </div>
        ))}
      </div>
    );
  }


  const activeDeliveries = metrics.deliveriesByStatus.pending + metrics.deliveriesByStatus.in_progress;

  return (
    <div className={GRID}>
      <StatCard
        label="Total vehicles"
        value={formatNumber(metrics.totalVehicles)}
        icon={<Truck className="size-4" />}
        tone="default"
      />
      <StatCard
        label="Available"
        value={formatNumber(metrics.vehiclesAvailable)}
        icon={<CheckCircle2 className="size-4" />}
        tone="success"
      />
      <StatCard
        label="On delivery"
        value={formatNumber(metrics.vehiclesOnDelivery)}
        icon={<Navigation className="size-4" />}
        tone="info"
      />
      <StatCard
        label="In maintenance"
        value={formatNumber(metrics.vehiclesInMaintenance)}
        icon={<Wrench className="size-4" />}
        tone="error"
      />
      <StatCard
        label="Utilisation"
        value={`${metrics.assetUtilizationRate}%`}
        icon={<Activity className="size-4" />}
        tone="success"
      />
      <StatCard
        label="Active deliveries"
        value={formatNumber(activeDeliveries)}
        icon={<Package className="size-4" />}
        tone="warning"
      />
    </div>
  );
}

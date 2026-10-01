import { Boxes, CalendarDays, CheckCircle2, Package, Percent, Users } from 'lucide-react';
import type { ReportSummary } from '@/types/domain';
import { formatNumber } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatCard } from '@/components/ui/StatCard';

/** FR8 — report summary metrics (server-computed). */

export interface ReportSummaryCardsProps {
  summary: ReportSummary | undefined;
  loading?: boolean;
}

export function ReportSummaryCards({ summary, loading = false }: ReportSummaryCardsProps) {
  if (loading || !summary) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
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


  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        label="Total waybills"
        value={formatNumber(summary.total)}
        icon={<Package className="size-4" />}
      />
      <StatCard
        label="Delivered"
        value={formatNumber(summary.byStatus.delivered)}
        icon={<CheckCircle2 className="size-4" />}
        tone="success"
      />
      <StatCard
        label="Completion rate"
        value={`${summary.completionRate}%`}
        icon={<Percent className="size-4" />}
        tone="info"
      />
      <StatCard
        label="Items carried"
        value={formatNumber(summary.totalItems)}
        icon={<Boxes className="size-4" />}
        tone="warning"
      />
      <StatCard
        label="Customers served"
        value={formatNumber(summary.uniqueCustomers)}
        icon={<Users className="size-4" />}
      />
      <StatCard
        label="Avg / day"
        value={summary.averagePerDay}
        icon={<CalendarDays className="size-4" />}
      />
    </div>
  );
}

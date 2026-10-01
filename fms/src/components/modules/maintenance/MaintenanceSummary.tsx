import { Wallet } from 'lucide-react';
import type { MaintenanceRow } from '@/lib/mockApi';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

/** FR6 — maintenance expenditure summary (plan.md §2.7). */

export interface MaintenanceSummaryProps {
  logs: MaintenanceRow[];
  loading?: boolean;
}

export function MaintenanceSummary({ logs, loading = false }: MaintenanceSummaryProps) {
  const total = logs.reduce((sum, log) => sum + log.cost, 0);

  const byVehicle = new Map<string, number>();
  for (const log of logs) {
    const key = log.vehicle?.registrationNumber ?? `#${log.vehicleId}`;
    byVehicle.set(key, (byVehicle.get(key) ?? 0) + log.cost);
  }
  const ranked = [...byVehicle.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = ranked[0]?.[1] ?? 1;

  return (
    <Card className="flex h-full flex-col">
      <div className="mb-4">
        <CardTitle>Maintenance expenditure</CardTitle>
        <CardDescription>Workshop spend across {formatNumber(logs.length)} service records</CardDescription>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-9 w-32" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 rounded-control bg-surface-sunken px-4 py-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-chip bg-brand-100 text-brand-700">
              <Wallet className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Total spend
              </p>
              <p className="text-xl font-bold tabular-nums tracking-tight text-ink-primary">
                {formatCurrency(total)}
              </p>
            </div>
          </div>

          {ranked.length > 0 && (
            <div className="mt-5 flex-1">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Highest spend by vehicle
              </p>
              <ul className="space-y-3">
                {ranked.map(([reg, cost]) => (
                  <li key={reg}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-[13px]">
                      <span className="font-mono text-ink-body">{reg}</span>
                      <span className="font-medium tabular-nums text-ink-primary">
                        {formatCurrency(cost)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${Math.max(6, (cost / max) * 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

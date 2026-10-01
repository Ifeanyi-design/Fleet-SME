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
          <div className="flex items-center gap-3.5 rounded-control border border-hairline/80 bg-gradient-to-b from-slate-50/90 to-slate-50/40 p-4 shadow-xs">
            <span className="grid size-11 shrink-0 place-items-center rounded-chip bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700 ring-1 ring-inset ring-brand-600/20 shadow-xs">
              <Wallet className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                Total spend
              </p>
              <p className="text-2xl font-bold tabular-nums tracking-tight text-ink-primary">
                {formatCurrency(total)}
              </p>
            </div>
          </div>

          {ranked.length > 0 && (
            <div className="mt-5 flex-1">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                Highest spend by vehicle
              </p>
              <ul className="space-y-3.5">
                {ranked.map(([reg, cost]) => (
                  <li key={reg}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-[13px]">
                      <span className="font-mono font-medium text-ink-primary">{reg}</span>
                      <span className="font-semibold tabular-nums text-ink-primary">
                        {formatCurrency(cost)}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-hairline/60">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-300"
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


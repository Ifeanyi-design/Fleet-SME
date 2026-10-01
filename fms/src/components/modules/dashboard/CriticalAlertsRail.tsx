import { ShieldAlert, ShieldCheck, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { DashboardMetrics } from '@/types/domain';
import { cn } from '@/lib/cn';
import { daysUntil, formatDate } from '@/lib/formatters';
import { Badge } from '@/components/ui/Badge';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

/** FR6 / FR2 — critical maintenance & licence alerts (plan.md §2.2, step 4). */

interface AlertRow {
  id: string;
  icon: typeof Wrench;
  title: string;
  detail: string;
  badge: { label: string; variant: 'error' | 'warning' };
  to: string;
}

export interface CriticalAlertsRailProps {
  metrics: DashboardMetrics | undefined;
  loading?: boolean;
}

export function CriticalAlertsRail({ metrics, loading = false }: CriticalAlertsRailProps) {
  const navigate = useNavigate();

  const alerts: AlertRow[] = [];

  if (metrics) {
    for (const row of metrics.serviceDueSoon) {
      const overdue = row.overdue;
      alerts.push({
        id: `service-${row.vehicle.vehicleId}`,
        icon: Wrench,
        title: row.vehicle.registrationNumber,
        detail: overdue
          ? `Service was due ${formatDate(row.nextDueDate)}`
          : `Service due ${formatDate(row.nextDueDate)}`,
        badge: overdue
          ? { label: `Overdue ${Math.abs(daysUntil(row.nextDueDate))}d`, variant: 'error' }
          : { label: `In ${daysUntil(row.nextDueDate)}d`, variant: 'warning' },
        to: `/vehicles/${row.vehicle.vehicleId}`,
      });
    }

    for (const row of metrics.licensesExpiringSoon) {
      const expired = row.daysLeft < 0;
      alerts.push({
        id: `licence-${row.driver.driverId}`,
        icon: ShieldAlert,
        title: row.driver.fullName,
        detail: expired
          ? `Licence expired ${formatDate(row.driver.licenseExpiryDate)}`
          : `Licence expires ${formatDate(row.driver.licenseExpiryDate)}`,
        badge: expired
          ? { label: `Expired ${Math.abs(row.daysLeft)}d`, variant: 'error' }
          : { label: `In ${row.daysLeft}d`, variant: 'warning' },
        to: `/drivers/${row.driver.driverId}`,
      });
    }
  }

  const hasErrors = alerts.some((a) => a.badge.variant === 'error');

  return (
    <Card className="flex flex-col overflow-hidden">
      {/* ── Header with dynamic count badge ──────────────────────────────────── */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle>Critical alerts</CardTitle>
            {!loading && alerts.length > 0 && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ring-1 ring-inset shadow-xs',
                  hasErrors
                    ? 'bg-red-50 text-red-700 ring-red-600/20'
                    : 'bg-amber-50 text-amber-700 ring-amber-600/20',
                )}
              >
                {alerts.length}
              </span>
            )}
          </div>
          <CardDescription>Preventive service &amp; licence compliance</CardDescription>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          {/* All-clear state: gradient circle for a more premium feel */}
          <span className="mb-3 grid size-12 place-items-center rounded-full bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700 shadow-xs ring-4 ring-brand-500/10">
            <ShieldCheck className="size-6" aria-hidden />
          </span>
          <p className="text-sm font-semibold text-ink-primary">All clear</p>
          <p className="mt-1 text-[13px] text-ink-secondary">
            No service or licence issues in the alert window.
          </p>
        </div>
      ) : (
        /* ── Bounded scrollable list prevents container blowouts ────────────── */
        <ul className="-mr-1 max-h-[19rem] space-y-2 overflow-y-auto pr-1">
          {alerts.map((alert) => (
            <li key={alert.id}>
              <button
                type="button"
                onClick={() => navigate(alert.to)}
                className={cn(
                  'group flex w-full flex-col rounded-control border p-3 text-left transition-all duration-150 shadow-xs',
                  alert.badge.variant === 'error'
                    ? 'border-red-200/80 bg-red-50/30 hover:border-red-300 hover:bg-red-50/60'
                    : 'border-amber-200/80 bg-amber-50/30 hover:border-amber-300 hover:bg-amber-50/60',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        'grid size-6 shrink-0 place-items-center rounded-md shadow-2xs',
                        alert.badge.variant === 'error'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700',
                      )}
                      aria-hidden
                    >
                      <alert.icon className="size-3.5" />
                    </span>
                    <span className="truncate text-[13px] font-bold text-ink-primary group-hover:text-ink-primary">
                      {alert.title}
                    </span>
                  </div>
                  <Badge variant={alert.badge.variant} className="shrink-0 text-[11px] px-2 py-0.5">
                    {alert.badge.label}
                  </Badge>
                </div>
                <p className="mt-1.5 pl-8 text-xs text-ink-secondary truncate">
                  {alert.detail}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}


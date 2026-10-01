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

  return (
    <Card className="flex h-full flex-col">
      <div className="mb-4">
        <CardTitle>Critical alerts</CardTitle>
        <CardDescription>Preventive service &amp; licence compliance</CardDescription>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <span className="mb-3 grid size-12 place-items-center rounded-full bg-brand-100 text-brand-700">
            <ShieldCheck className="size-6" aria-hidden />
          </span>
          <p className="text-sm font-semibold text-ink-primary">All clear</p>
          <p className="mt-1 text-[13px] text-ink-secondary">
            No service or licence issues in the alert window.
          </p>
        </div>
      ) : (
        <ul className="-mx-1 space-y-1">
          {alerts.map((alert) => (
            <li key={alert.id}>
              <button
                type="button"
                onClick={() => navigate(alert.to)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-control px-2 py-2.5 text-left transition-colors duration-150',
                  'hover:bg-surface-hover',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 grid size-8 shrink-0 place-items-center rounded-chip',
                    alert.badge.variant === 'error'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700',
                  )}
                  aria-hidden
                >
                  <alert.icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-ink-primary">
                    {alert.title}
                  </span>
                  <span className="block truncate text-xs text-ink-secondary">{alert.detail}</span>
                </span>
                <Badge variant={alert.badge.variant} className="shrink-0">
                  {alert.badge.label}
                </Badge>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

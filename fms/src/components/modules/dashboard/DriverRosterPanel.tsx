import { ArrowRight, Phone, ShieldAlert, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DashboardMetrics } from '@/types/domain';
import { daysUntil, formatNumber } from '@/lib/formatters';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusPill } from '@/components/ui/StatusPill';

/**
 * Table 3.6 specifies "driver roster status badges" on the Operations Dashboard — the
 * dispatcher needs to see who is free at a glance, not just a headcount.
 */

export interface DriverRosterPanelProps {
  metrics: DashboardMetrics | undefined;
  loading?: boolean;
}

export function DriverRosterPanel({ metrics, loading = false }: DriverRosterPanelProps) {
  const roster = metrics?.driverRoster ?? [];

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <CardTitle>Daily Driver Roster</CardTitle>
          <CardDescription>Real-time rider availability across the team</CardDescription>
        </div>
        <Link to="/drivers">
          <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="size-4" />}>
            Manage
          </Button>
        </Link>
      </div>

      {/* ── Availability 3-column KPI strip (inspired by Quick Courier/NexaFleet) ─ */}
      {loading || !metrics ? (
        <div className="mb-4 grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : (
        <div className="mb-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-control border border-emerald-100 bg-emerald-50/50 p-2.5 shadow-2xs">
            <p className="text-xl font-bold tabular-nums tracking-tight text-emerald-700">
              {formatNumber(metrics.driverAvailability.available)}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-emerald-800/80">Available</p>
          </div>
          <div className="rounded-control border border-blue-100 bg-blue-50/50 p-2.5 shadow-2xs">
            <p className="text-xl font-bold tabular-nums tracking-tight text-blue-700">
              {formatNumber(metrics.driverAvailability.on_delivery)}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-blue-800/80">On delivery</p>
          </div>
          <div className="rounded-control border border-slate-100 bg-slate-50/70 p-2.5 shadow-2xs">
            <p className="text-xl font-bold tabular-nums tracking-tight text-slate-700">
              {formatNumber(metrics.driverAvailability.off_duty)}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-600">Off duty</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : roster.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          {/* Empty state: gradient circle to match the All-clear style */}
          <span className="mb-3 grid size-12 place-items-center rounded-full bg-gradient-to-br from-slate-50 to-slate-100 text-ink-secondary ring-4 ring-slate-100/50">
            <Users className="size-6" aria-hidden />
          </span>
          <p className="text-sm font-semibold text-ink-primary">No drivers on the roster</p>
          <p className="mt-1 text-[13px] text-ink-secondary">
            Enrol a rider from the driver console.
          </p>
        </div>
      ) : (
        /* ── Bounded scrollable list matching CriticalAlertsRail ────────────── */
        <ul className="-mr-1 max-h-[19rem] space-y-1.5 overflow-y-auto pr-1">
          {roster.map((driver) => {
            const daysLeft = daysUntil(driver.licenseExpiryDate);
            const isExpiring = daysLeft <= 30;
            const isExpired = daysLeft < 0;

            return (
              <li key={driver.driverId}>
                <Link
                  to={`/drivers/${driver.driverId}`}
                  className="group flex items-center gap-3 rounded-control border border-hairline/70 bg-white p-2.5 transition-all duration-150 hover:border-hairline-strong hover:bg-slate-50/80 shadow-2xs"
                >
                  <Avatar name={driver.fullName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[13px] font-bold text-ink-primary group-hover:text-brand-700 transition-colors">
                        {driver.fullName}
                      </span>
                      {isExpired ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-1.5 py-0.2 text-[10px] font-bold text-red-700 ring-1 ring-inset ring-red-600/20">
                          <ShieldAlert className="size-2.5" /> Expired
                        </span>
                      ) : isExpiring ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.2 text-[10px] font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                          Expires {daysLeft}d
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-muted">
                      <Phone className="size-3 text-ink-muted/80" />
                      <span className="truncate tabular-nums">{driver.phoneNumber}</span>
                    </p>
                  </div>
                  <StatusPill status={driver.status} className="shrink-0" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}


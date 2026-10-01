import { ArrowRight, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DashboardMetrics, DriverStatus } from '@/types/domain';
import { cn } from '@/lib/cn';
import { formatNumber } from '@/lib/formatters';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusPill } from '@/components/ui/StatusPill';
import { LicenceExpiryBadge } from '@/components/modules/drivers/LicenceExpiryBadge';

/**
 * Table 3.6 specifies "driver roster status badges" on the Operations Dashboard — the
 * dispatcher needs to see who is free at a glance, not just a headcount.
 */

const BREAKDOWN: Array<{ status: DriverStatus; label: string; tone: string }> = [
  { status: 'available', label: 'Available', tone: 'bg-brand-100 text-brand-700' },
  { status: 'on_delivery', label: 'On delivery', tone: 'bg-blue-100 text-blue-700' },
  { status: 'off_duty', label: 'Off duty', tone: 'bg-gray-100 text-gray-600' },
];

export interface DriverRosterPanelProps {
  metrics: DashboardMetrics | undefined;
  loading?: boolean;
}

export function DriverRosterPanel({ metrics, loading = false }: DriverRosterPanelProps) {
  const roster = metrics?.driverRoster ?? [];

  return (
    <Card className="flex h-full flex-col">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <CardTitle>Driver roster</CardTitle>
          <CardDescription>Availability across the team</CardDescription>
        </div>
        <Link to="/drivers">
          <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="size-4" />}>
            Manage
          </Button>
        </Link>
      </div>

      {/* Availability breakdown (FR8). */}
      {loading || !metrics ? (
        <Skeleton className="h-8 w-full" />
      ) : (
        <div className="mb-4 flex flex-wrap gap-2">
          {BREAKDOWN.map((row) => (
            <span
              key={row.status}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                row.tone,
              )}
            >
              {row.label}
              <span className="tabular-nums">
                {formatNumber(metrics.driverAvailability[row.status])}
              </span>
            </span>
          ))}
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
          <span className="mb-3 grid size-12 place-items-center rounded-full bg-slate-100 text-ink-secondary">
            <Users className="size-6" aria-hidden />
          </span>
          <p className="text-sm font-semibold text-ink-primary">No drivers on the roster</p>
          <p className="mt-1 text-[13px] text-ink-secondary">
            Enrol a rider from the driver console.
          </p>
        </div>
      ) : (
        <ul className="-mx-1 max-h-[22rem] flex-1 space-y-0.5 overflow-y-auto">
          {roster.map((driver) => (
            <li key={driver.driverId}>
              <Link
                to={`/drivers/${driver.driverId}`}
                className="flex items-center gap-3 rounded-control px-2 py-2.5 transition-colors duration-150 hover:bg-surface-hover"
              >
                <Avatar name={driver.fullName} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-ink-primary">
                    {driver.fullName}
                  </span>
                  <span className="mt-0.5 block">
                    <LicenceExpiryBadge expiryDate={driver.licenseExpiryDate} />
                  </span>
                </span>
                <StatusPill status={driver.status} className="shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

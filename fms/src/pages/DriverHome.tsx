import { CheckCircle2, ClipboardList, Link2Off } from 'lucide-react';
import { useAuth, useDriverId } from '@/context/AuthContext';
import { useDeliveriesForDriver } from '@/hooks/useDeliveries';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { AssignmentCard } from '@/components/modules/driver-app/AssignmentCard';

/** Driver Execution screen (PRD Table 3.6 row 6) — mobile-first, data-light (NFR7). */

export function DriverHome() {
  const { user } = useAuth();
  const driverId = useDriverId();

  const query = useDeliveriesForDriver(driverId);
  const all = query.data ?? [];

  const todayKey = new Date().toISOString().slice(0, 10);
  const active = all.filter((d) => d.status === 'in_progress');
  const completedToday = all.filter(
    (d) => d.status === 'delivered' && d.dateDelivered?.slice(0, 10) === todayKey,
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink-primary">Today&apos;s deliveries</h1>
        <p className="mt-0.5 text-[13px] text-ink-secondary">
          Welcome back, {user?.name?.split(' ')[0]}.
        </p>
      </div>

      {driverId === null ? (
        <Card flush>
          <EmptyState
            icon={<Link2Off className="size-6" />}
            title="Account not linked to a rider"
            description="This login is not attached to a driver record yet. Ask the dispatch office to link it."
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-card border border-hairline bg-surface p-4 shadow-card">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Active
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-ink-primary">
                {active.length}
              </p>
            </div>
            <div className="rounded-card border border-hairline bg-surface p-4 shadow-card">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Completed today
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-brand-700">
                {completedToday.length}
              </p>
            </div>
          </div>

          <section className="space-y-3">
            <h2 className="text-base font-semibold tracking-[-0.01em] text-ink-primary">
              Assigned waybills
            </h2>

            {query.isLoading ? (
              <>
                <Skeleton className="h-56 w-full" />
                <Skeleton className="h-56 w-full" />
              </>
            ) : query.isError ? (
              <ErrorState
                title="Could not load your assignments"
                description="Check your connection and try again."
                onRetry={() => void query.refetch()}
              />
            ) : active.length === 0 ? (
              <Card flush>
                <EmptyState
                  icon={<ClipboardList className="size-6" />}
                  title="No active assignments"
                  description="New waybills assigned by dispatch will appear here."
                />
              </Card>
            ) : (
              active.map((delivery) => (
                <AssignmentCard key={delivery.deliveryId} delivery={delivery} showActions />
              ))
            )}
          </section>

          {completedToday.length > 0 && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-base font-semibold tracking-[-0.01em] text-ink-primary">
                <CheckCircle2 className="size-4 text-brand-600" aria-hidden />
                Completed today
              </h2>
              {completedToday.slice(0, 5).map((delivery) => (
                <AssignmentCard key={delivery.deliveryId} delivery={delivery} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}

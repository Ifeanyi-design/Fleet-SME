import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2Off, LogOut, Phone } from 'lucide-react';
import { useAuth, useDriverId } from '@/context/AuthContext';
import { useDriver } from '@/hooks/useDrivers';
import { useDeliveriesForDriver } from '@/hooks/useDeliveries';
import { Avatar } from '@/components/ui/Avatar';
import { AlertDialog } from '@/components/ui/AlertDialog';
import { Button } from '@/components/ui/Button';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusPill } from '@/components/ui/StatusPill';
import { DetailList } from '@/components/modules/shared/DetailList';
import { LicenceExpiryBadge } from '@/components/modules/drivers/LicenceExpiryBadge';

/** Driver profile — the rider's own record, licence compliance and activity. */

export function DriverProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);

  const driverId = useDriverId();
  const driverQuery = useDriver(driverId);
  const deliveriesQuery = useDeliveriesForDriver(driverId);

  // The API embeds the driver record on login; fall back to a fetch (mock mode).
  const driver = user?.driver ?? driverQuery.data ?? null;
  const deliveries = deliveriesQuery.data ?? [];
  const completed = deliveries.filter((d) => d.status === 'delivered').length;
  const cancelled = deliveries.filter((d) => d.status === 'cancelled').length;

  function handleSignOut() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold tracking-tight text-ink-primary">Profile</h1>

      <Card className="p-4">
        <div className="flex items-center gap-3.5">
          <Avatar name={user?.name ?? 'Driver'} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-ink-primary">{user?.name}</p>
            <p className="truncate text-[13px] text-ink-secondary">{user?.email}</p>
          </div>
          {driver && <StatusPill status={driver.status} />}
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-4">
          <CardTitle>Rider record</CardTitle>
          <CardDescription>Held by the dispatch office</CardDescription>
        </div>

        {driverQuery.isLoading && driverId !== null ? (
          <Skeleton className="h-24 w-full" />
        ) : !driver ? (
          <EmptyState
            icon={<Link2Off className="size-6" />}
            title="No rider record linked"
            description="This login is not attached to a driver record yet. Ask the dispatch office to link it."
          />
        ) : (
          <DetailList
            columns={2}
            items={[
              { label: 'Full name', value: driver.fullName },
              {
                label: 'Phone',
                value: (
                  <a
                    href={`tel:${driver.phoneNumber}`}
                    className="inline-flex items-center gap-1.5 text-brand-700 transition-colors hover:text-brand-800 hover:underline"
                  >
                    <Phone className="size-3.5" aria-hidden />
                    {driver.phoneNumber}
                  </a>
                ),
              },
              {
                label: 'Licence number',
                value: <span className="font-mono">{driver.licenseNumber}</span>,
              },
              {
                label: 'Licence expiry',
                value: <LicenceExpiryBadge expiryDate={driver.licenseExpiryDate} showDate />,
              },
            ]}
          />
        )}
      </Card>

      <Card className="p-4">
        <div className="mb-4">
          <CardTitle>My activity</CardTitle>
          <CardDescription>Across all recorded waybills</CardDescription>
        </div>

        {deliveriesQuery.isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-chip bg-surface-sunken px-3 py-3 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Total
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-ink-primary">
                {deliveries.length}
              </p>
            </div>
            <div className="rounded-chip bg-surface-sunken px-3 py-3 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Delivered
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-brand-700">{completed}</p>
            </div>
            <div className="rounded-chip bg-surface-sunken px-3 py-3 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Cancelled
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-ink-secondary">{cancelled}</p>
            </div>
          </div>
        )}
      </Card>

      <Button
        variant="secondary"
        fullWidth
        leftIcon={<LogOut className="size-4" />}
        onClick={() => setConfirmingSignOut(true)}
      >
        Sign out
      </Button>

      <AlertDialog
        open={confirmingSignOut}
        onClose={() => setConfirmingSignOut(false)}
        onConfirm={handleSignOut}
        title="Sign out?"
        description="You will be returned to the sign-in screen."
        confirmLabel="Sign out"
        cancelLabel="Stay signed in"
      />
    </div>
  );
}

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, Phone } from 'lucide-react';
import { useDriver } from '@/hooks/useDrivers';
import { useDeliveriesForDriver } from '@/hooks/useDeliveries';
import { PageHeader } from '@/components/layouts/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusPill } from '@/components/ui/StatusPill';
import { DetailList } from '@/components/modules/shared/DetailList';
import { LicenceExpiryBadge } from '@/components/modules/drivers/LicenceExpiryBadge';
import { RecentDeliveriesTable } from '@/components/modules/dispatch/RecentDeliveriesTable';

/** Driver detail — profile, licence compliance and delivery history. */

export function DriverDetail() {
  const { driverId } = useParams<{ driverId: string }>();
  const id = Number(driverId);

  const driverQuery = useDriver(id);
  const deliveriesQuery = useDeliveriesForDriver(id);
  const [showAll, setShowAll] = useState(false);

  if (driverQuery.isLoading) return <FullPageSpinner label="Loading driver…" />;

  if (driverQuery.isError) {
    return (
      <>
        <PageHeader
          title={`Driver #${driverId}`}
          breadcrumbs={[{ label: 'Fleet' }, { label: 'Drivers', to: '/drivers' }, { label: `#${driverId}` }]}
        />
        <ErrorState title="Could not load this driver" onRetry={() => void driverQuery.refetch()} />
      </>
    );
  }

  if (!driverQuery.data) {
    return (
      <>
        <PageHeader
          title={`Driver #${driverId}`}
          breadcrumbs={[{ label: 'Fleet' }, { label: 'Drivers', to: '/drivers' }, { label: `#${driverId}` }]}
        />
        <Card flush>
          <EmptyState
            icon={<AlertCircle className="size-6" />}
            title="Driver not found"
            description="This driver may have left the roster or the link is incorrect."
          />
        </Card>
      </>
    );
  }

  const driver = driverQuery.data;
  const deliveries = deliveriesQuery.data ?? [];
  const completed = deliveries.filter((d) => d.status === 'delivered').length;

  return (
    <>
      <PageHeader
        title={driver.fullName}
        description={`Licence ${driver.licenseNumber}`}
        breadcrumbs={[
          { label: 'Fleet' },
          { label: 'Drivers', to: '/drivers' },
          { label: driver.fullName },
        ]}
        actions={<StatusPill status={driver.status} />}
      />

      <div className="space-y-6">
        <Card>
          <div className="mb-5 flex items-center gap-3.5 border-b border-hairline pb-5">
            <Avatar name={driver.fullName} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-ink-primary">{driver.fullName}</p>
              <a
                href={`tel:${driver.phoneNumber}`}
                className="mt-0.5 inline-flex items-center gap-1.5 text-[13px] text-brand-700 transition-colors hover:text-brand-800 hover:underline"
              >
                <Phone className="size-3.5" aria-hidden />
                {driver.phoneNumber}
              </a>
            </div>
          </div>

          {deliveriesQuery.isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <DetailList
              columns={3}
              items={[
                { label: 'Licence number', value: <span className="font-mono">{driver.licenseNumber}</span> },
                { label: 'Licence expiry', value: <LicenceExpiryBadge expiryDate={driver.licenseExpiryDate} showDate /> },
                { label: 'Operational status', value: <StatusPill status={driver.status} /> },
                { label: 'Total waybills', value: deliveries.length },
                { label: 'Completed', value: completed },
                {
                  label: 'Completion rate',
                  value: deliveries.length
                    ? `${Math.round((completed / deliveries.length) * 100)}%`
                    : '—',
                },
              ]}
            />
          )}
        </Card>

        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold tracking-[-0.01em] text-ink-primary">
              Delivery history
            </h2>
            {deliveries.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="text-[13px] font-medium text-brand-700 transition-colors hover:text-brand-800 hover:underline"
              >
                {showAll ? 'Show recent only' : `Show all ${deliveries.length}`}
              </button>
            )}
          </div>
          <RecentDeliveriesTable
            deliveries={showAll ? deliveries : deliveries.slice(0, 5)}
            loading={deliveriesQuery.isLoading}
          />
        </section>
      </div>
    </>
  );
}

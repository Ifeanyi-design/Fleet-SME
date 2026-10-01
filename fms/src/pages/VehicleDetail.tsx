import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, Wrench } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { vehicleTypeLabel } from '@/lib/labels';
import { useVehicle } from '@/hooks/useVehicles';
import { useMaintenanceForVehicle } from '@/hooks/useMaintenance';
import { useDeliveriesForVehicle } from '@/hooks/useDeliveries';
import { PageHeader } from '@/components/layouts/PageHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusPill } from '@/components/ui/StatusPill';
import { DetailList } from '@/components/modules/shared/DetailList';
import { MaintenanceLogTable } from '@/components/modules/maintenance/MaintenanceLogTable';
import { RecentDeliveriesTable } from '@/components/modules/dispatch/RecentDeliveriesTable';

/** Vehicle detail — asset summary, service history and delivery history. */

export function VehicleDetail() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const id = Number(vehicleId);

  const vehicleQuery = useVehicle(id);
  const maintenanceQuery = useMaintenanceForVehicle(id);
  const deliveriesQuery = useDeliveriesForVehicle(id);

  const [showAllDeliveries, setShowAllDeliveries] = useState(false);

  if (vehicleQuery.isLoading) return <FullPageSpinner label="Loading vehicle…" />;

  if (vehicleQuery.isError) {
    return (
      <>
        <PageHeader
          title={`Vehicle #${vehicleId}`}
          breadcrumbs={[{ label: 'Fleet' }, { label: 'Vehicles', to: '/vehicles' }, { label: `#${vehicleId}` }]}
        />
        <ErrorState title="Could not load this vehicle" onRetry={() => void vehicleQuery.refetch()} />
      </>
    );
  }

  if (!vehicleQuery.data) {
    return (
      <>
        <PageHeader
          title={`Vehicle #${vehicleId}`}
          breadcrumbs={[{ label: 'Fleet' }, { label: 'Vehicles', to: '/vehicles' }, { label: `#${vehicleId}` }]}
        />
        <Card flush>
          <EmptyState
            icon={<AlertCircle className="size-6" />}
            title="Vehicle not found"
            description="This asset may have been retired or the link is incorrect."
          />
        </Card>
      </>
    );
  }

  const vehicle = vehicleQuery.data;
  const logs = maintenanceQuery.data ?? [];
  const totalServiceCost = logs.reduce((sum, log) => sum + log.cost, 0);
  const deliveries = deliveriesQuery.data ?? [];

  return (
    <>
      <PageHeader
        title={vehicle.registrationNumber}
        description={`${vehicle.make} ${vehicle.model}`}
        breadcrumbs={[
          { label: 'Fleet' },
          { label: 'Vehicles', to: '/vehicles' },
          { label: vehicle.registrationNumber },
        ]}
        actions={<StatusPill status={vehicle.status} />}
      />

      <div className="space-y-6">
        <Card>
          {maintenanceQuery.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <DetailList
              columns={3}
              items={[
                { label: 'Make', value: vehicle.make },
                { label: 'Model', value: vehicle.model },
                { label: 'Type', value: vehicleTypeLabel(vehicle.vehicleType) },
                { label: 'Odometer', value: `${formatNumber(vehicle.odometer)} km` },
                { label: 'Operational status', value: <StatusPill status={vehicle.status} /> },
                { label: 'Total service cost', value: formatCurrency(totalServiceCost) },
              ]}
            />
          )}
        </Card>

        <section>
          <div className="mb-4 flex items-center gap-2.5">
            <Wrench className="size-4 text-ink-secondary" aria-hidden />
            <h2 className="text-base font-semibold tracking-[-0.01em] text-ink-primary">
              Service history
            </h2>
          </div>
          <MaintenanceLogTable logs={logs} loading={maintenanceQuery.isLoading} hideVehicle />
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold tracking-[-0.01em] text-ink-primary">
              Delivery history
            </h2>
            {deliveries.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAllDeliveries((v) => !v)}
                className="text-[13px] font-medium text-brand-700 transition-colors hover:text-brand-800 hover:underline"
              >
                {showAllDeliveries ? 'Show recent only' : `Show all ${deliveries.length}`}
              </button>
            )}
          </div>
          <RecentDeliveriesTable
            deliveries={showAllDeliveries ? deliveries : deliveries.slice(0, 5)}
            loading={deliveriesQuery.isLoading}
          />
        </section>
      </div>
    </>
  );
}

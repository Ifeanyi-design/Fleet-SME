import { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import type { DeliveryDetail } from '@/types/domain';
import { useDeliveries } from '@/hooks/useDeliveries';
import { useDrivers } from '@/hooks/useDrivers';
import { useVehicles } from '@/hooks/useVehicles';
import { PageHeader } from '@/components/layouts/PageHeader';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { PendingOrderQueue } from '@/components/modules/dispatch/PendingOrderQueue';
import { AllocationPanel } from '@/components/modules/dispatch/AllocationPanel';
import { ActiveDispatchTable } from '@/components/modules/dispatch/ActiveDispatchTable';
import { DeliveryFormDialog } from '@/components/modules/dispatch/DeliveryFormDialog';

/** Dispatch Board — PRD Table 3.6 row 5, FR3/FR4/FR7. */

export interface DispatchProps {
  /** Open the new-order dialog on mount (used by the /dispatch/new route). */
  initialFormOpen?: boolean;
}

export function Dispatch({ initialFormOpen = false }: DispatchProps) {
  const [selected, setSelected] = useState<DeliveryDetail | null>(null);
  const [formOpen, setFormOpen] = useState(initialFormOpen);

  const pendingQuery = useDeliveries({ status: 'pending' });
  const activeQuery = useDeliveries({ status: 'in_progress' });
  const availableDrivers = useDrivers({ status: 'available' });
  const availableVehicles = useVehicles({ status: 'available' });

  const pending = pendingQuery.data ?? [];
  const active = activeQuery.data ?? [];

  function refreshAll() {
    void pendingQuery.refetch();
    void activeQuery.refetch();
    void availableDrivers.refetch();
    void availableVehicles.refetch();
  }

  return (
    <>
      <PageHeader
        title="Dispatch Board"
        description="Allocate available vehicles and drivers to pending delivery orders."
        breadcrumbs={[{ label: 'Dispatch' }, { label: 'Board' }]}
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<RefreshCw className="size-4" />}
              onClick={refreshAll}
              disabled={pendingQuery.isFetching}
            >
              Refresh
            </Button>
            <Button leftIcon={<Plus className="size-4" />} onClick={() => setFormOpen(true)}>
              New order
            </Button>
          </>
        }
      />

      {pendingQuery.isError ? (
        <ErrorState
          title="Could not load the dispatch queue"
          onRetry={() => void pendingQuery.refetch()}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <PendingOrderQueue
            deliveries={pending}
            loading={pendingQuery.isLoading}
            selectedId={selected?.deliveryId ?? null}
            onSelect={setSelected}
          />
          <div className="lg:col-span-2">
            <AllocationPanel
              delivery={selected}
              availableDrivers={availableDrivers.data ?? []}
              availableVehicles={availableVehicles.data ?? []}
              driversLoading={availableDrivers.isLoading}
              vehiclesLoading={availableVehicles.isLoading}
              onAssigned={() => setSelected(null)}
            />
          </div>
        </div>
      )}

      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-base font-semibold tracking-[-0.01em] text-ink-primary">
            Active dispatches
          </h2>
          <p className="text-[13px] text-ink-secondary">
            Deliveries currently in progress across the fleet
          </p>
        </div>
        <ActiveDispatchTable
          deliveries={active}
          loading={activeQuery.isLoading}
          pageSize={10}
        />
      </section>

      <DeliveryFormDialog open={formOpen} onClose={() => setFormOpen(false)} />
    </>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, PackageSearch, Send } from 'lucide-react';
import type { DeliveryDetail, Driver, Vehicle } from '@/types/domain';
import { errorMessage } from '@/lib/errors';
import { useAssignDelivery } from '@/hooks/useMutations';
import { Button } from '@/components/ui/Button';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ResourceSelector } from '@/components/modules/dispatch/ResourceSelector';
import { useToast } from '@/components/ui/Toast';

/**
 * FR4 / FR7 — allocation panel.
 * Verifies availability before commit; a rejected allocation surfaces the server's
 * conflict message in a banner (PRD TC03) instead of silently failing.
 */

export interface AllocationPanelProps {
  delivery: DeliveryDetail | null;
  availableDrivers: Driver[];
  availableVehicles: Vehicle[];
  driversLoading?: boolean;
  vehiclesLoading?: boolean;
  onAssigned: () => void;
}

export function AllocationPanel({
  delivery,
  availableDrivers,
  availableVehicles,
  driversLoading = false,
  vehiclesLoading = false,
  onAssigned,
}: AllocationPanelProps) {
  const [driverId, setDriverId] = useState<number | null>(null);
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);

  const assign = useAssignDelivery();
  const { toast } = useToast();

  // Reset the selection whenever a different order is picked.
  useEffect(() => {
    setDriverId(null);
    setVehicleId(null);
    setConflict(null);
  }, [delivery?.deliveryId]);

  const driverOptions = useMemo(
    () =>
      availableDrivers.map((d) => ({
        id: d.driverId,
        primary: d.fullName,
        secondary: d.phoneNumber,
      })),
    [availableDrivers],
  );

  const vehicleOptions = useMemo(
    () =>
      availableVehicles.map((v) => ({
        id: v.vehicleId,
        primary: v.registrationNumber,
        secondary: `${v.make} ${v.model}`,
      })),
    [availableVehicles],
  );

  async function handleConfirm() {
    if (!delivery || driverId === null || vehicleId === null) return;
    setConflict(null);

    try {
      await assign.mutateAsync({ deliveryId: delivery.deliveryId, driverId, vehicleId });
      toast({
        variant: 'success',
        title: 'Dispatch confirmed',
        description: `${delivery.trackingCode} is now In Progress.`,
      });
      onAssigned();
    } catch (err) {
      setConflict(errorMessage(err));
    }
  }

  if (!delivery) {
    return (
      <Card flush className="flex h-full items-center justify-center p-8">
        <EmptyState
          icon={<PackageSearch className="size-6" />}
          title="Select an order to allocate"
          description="Pick a pending order from the queue to assign a driver and vehicle."
        />
      </Card>
    );
  }

  const canConfirm = driverId !== null && vehicleId !== null && !assign.isPending;

  return (
    <Card className="flex h-full flex-col">
      <div className="mb-4">
        <CardTitle>Allocation</CardTitle>
        <CardDescription>Assign an available driver and vehicle</CardDescription>
      </div>

      {/* Selected order summary */}
      <div className="rounded-control border border-hairline/90 bg-gradient-to-b from-slate-50/80 to-slate-50/30 p-4 shadow-xs">
        <div className="flex items-center justify-between gap-3 border-b border-hairline pb-2.5">
          <span className="font-mono text-[13px] font-bold tracking-tight text-ink-primary">
            {delivery.trackingCode}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-ink-secondary">
            {delivery.customer?.name}
          </span>
        </div>
        <dl className="mt-3 space-y-2 text-[13px]">
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-xs font-medium uppercase tracking-wider text-ink-muted">Pickup</dt>
            <dd className="text-ink-body font-medium">{delivery.pickupAddress}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-xs font-medium uppercase tracking-wider text-ink-muted">Drop-off</dt>
            <dd className="text-ink-body font-medium">{delivery.dropoffAddress}</dd>
          </div>
        </dl>
        <ul className="mt-3 space-y-1.5 border-t border-hairline pt-3">
          {delivery.items.map((item) => (
            <li key={item.productId} className="flex justify-between text-xs text-ink-secondary">
              <span className="font-medium text-ink-body">{item.product?.productName ?? `Product #${item.productId}`}</span>
              <span className="font-semibold tabular-nums text-ink-primary">×{item.quantity}</span>
            </li>
          ))}
        </ul>
      </div>

      {conflict && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2.5 rounded-control border border-red-200 bg-red-50/80 p-3.5 text-[13px] text-red-700 shadow-xs"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{conflict}</span>
        </div>
      )}

      <div className="mt-5 space-y-4">
        <ResourceSelector
          label="Driver"
          htmlFor="assignDriver"
          value={driverId}
          onChange={setDriverId}
          options={driverOptions}
          placeholder="Select an available driver…"
          emptyHint="No drivers are currently available."
          loading={driversLoading}
          disabled={assign.isPending}
        />
        <ResourceSelector
          label="Vehicle"
          htmlFor="assignVehicle"
          value={vehicleId}
          onChange={setVehicleId}
          options={vehicleOptions}
          placeholder="Select an available vehicle…"
          emptyHint="No vehicles are currently available."
          loading={vehiclesLoading}
          disabled={assign.isPending}
        />
      </div>

      <div className="mt-auto flex items-center gap-2.5 border-t border-hairline pt-5">
        <Button
          fullWidth
          size="lg"
          onClick={handleConfirm}
          loading={assign.isPending}
          disabled={!canConfirm}
          leftIcon={!assign.isPending ? <Send className="size-4" /> : undefined}
        >
          Confirm dispatch
        </Button>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-ink-muted">
        <CheckCircle2 className="size-3.5 text-brand-600" aria-hidden />
        Availability is re-verified before the assignment is committed.
      </p>
    </Card>
  );
}


import type { Vehicle, VehicleStatus } from '@/types/domain';
import { errorMessage } from '@/lib/errors';
import { useSetVehicleStatus } from '@/hooks/useMutations';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { StatusPill, statusLabel } from '@/components/ui/StatusPill';
import { useToast } from '@/components/ui/Toast';

/**
 * FR7 — inline vehicle status change. Optimistic (see useSetVehicleStatus) with
 * rollback + toast on failure.
 */

const OPTIONS: VehicleStatus[] = ['available', 'on_delivery', 'in_maintenance', 'retired'];

export function VehicleStatusToggle({ vehicle }: { vehicle: Vehicle }) {
  const setStatus = useSetVehicleStatus();
  const { toast } = useToast();

  async function handleChange(status: VehicleStatus) {
    if (status === vehicle.status) return;
    try {
      await setStatus.mutateAsync({ vehicleId: vehicle.vehicleId, status });
      toast({
        variant: 'success',
        title: 'Status updated',
        description: `${vehicle.registrationNumber} is now ${statusLabel(status)}.`,
      });
    } catch (err) {
      toast({
        variant: 'error',
        title: 'Could not update status',
        description: errorMessage(err),
      });
    }
  }

  return (
    <DropdownMenu
      label={`Change status for ${vehicle.registrationNumber}`}
      trigger={<StatusPill status={vehicle.status} />}
      items={OPTIONS.map((status) => ({
        label: statusLabel(status),
        selected: status === vehicle.status,
        onSelect: () => void handleChange(status),
      }))}
    />
  );
}

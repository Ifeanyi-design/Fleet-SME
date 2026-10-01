import type { Driver, DriverStatus } from '@/types/domain';
import { errorMessage } from '@/lib/errors';
import { useSetDriverStatus } from '@/hooks/useMutations';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { StatusPill, statusLabel } from '@/components/ui/StatusPill';
import { useToast } from '@/components/ui/Toast';

/** FR7 — inline driver status change (optimistic with rollback). */

const OPTIONS: DriverStatus[] = ['available', 'on_delivery', 'off_duty'];

export function DriverStatusToggle({ driver }: { driver: Driver }) {
  const setStatus = useSetDriverStatus();
  const { toast } = useToast();

  async function handleChange(status: DriverStatus) {
    if (status === driver.status) return;
    try {
      await setStatus.mutateAsync({ driverId: driver.driverId, status });
      toast({
        variant: 'success',
        title: 'Status updated',
        description: `${driver.fullName} is now ${statusLabel(status)}.`,
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
      label={`Change status for ${driver.fullName}`}
      trigger={<StatusPill status={driver.status} />}
      items={OPTIONS.map((status) => ({
        label: statusLabel(status),
        selected: status === driver.status,
        onSelect: () => void handleChange(status),
      }))}
    />
  );
}

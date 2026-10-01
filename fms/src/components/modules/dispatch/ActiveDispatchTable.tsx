import { useState } from 'react';
import { Check, X } from 'lucide-react';
import type { DeliveryDetail } from '@/types/domain';
import { errorMessage } from '@/lib/errors';
import { timeAgo } from '@/lib/formatters';
import { useAdvanceDeliveryStatus } from '@/hooks/useMutations';
import { AlertDialog } from '@/components/ui/AlertDialog';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { useToast } from '@/components/ui/Toast';
import { DataTable, type Column } from '@/components/modules/shared/DataTable';
import { DeliveryLifecycleStepper } from '@/components/modules/dispatch/DeliveryLifecycleStepper';

/** FR5/FR7 — in-flight dispatches with lifecycle advance + cancel. */

export interface ActiveDispatchTableProps {
  deliveries: DeliveryDetail[];
  loading?: boolean;
  pageSize?: number;
}

export function ActiveDispatchTable({
  deliveries,
  loading = false,
  pageSize,
}: ActiveDispatchTableProps) {
  const advance = useAdvanceDeliveryStatus();
  const { toast } = useToast();
  const [pendingCancel, setPendingCancel] = useState<DeliveryDetail | null>(null);

  async function complete(delivery: DeliveryDetail) {
    try {
      await advance.mutateAsync({ deliveryId: delivery.deliveryId, status: 'delivered' });
      toast({
        variant: 'success',
        title: 'Delivery completed',
        description: `${delivery.trackingCode} delivered. Driver and vehicle released.`,
      });
    } catch (err) {
      toast({ variant: 'error', title: 'Could not complete', description: errorMessage(err) });
    }
  }

  async function confirmCancel() {
    if (!pendingCancel) return;
    try {
      await advance.mutateAsync({ deliveryId: pendingCancel.deliveryId, status: 'cancelled' });
      toast({
        variant: 'warning',
        title: 'Delivery cancelled',
        description: `${pendingCancel.trackingCode} was cancelled and resources released.`,
      });
    } catch (err) {
      toast({ variant: 'error', title: 'Could not cancel', description: errorMessage(err) });
    } finally {
      setPendingCancel(null);
    }
  }

  const columns: Column<DeliveryDetail>[] = [
    {
      key: 'waybill',
      header: 'Waybill',
      cell: (d) => (
        <span className="font-mono text-[13px] font-medium text-ink-primary">{d.trackingCode}</span>
      ),
      mobileLabel: 'Waybill',
    },
    {
      key: 'customer',
      header: 'Customer',
      cell: (d) => (
        <div className="min-w-0">
          <p className="truncate text-sm text-ink-primary">{d.customer?.name ?? '—'}</p>
          <p className="truncate text-xs text-ink-muted">{d.dropoffAddress}</p>
        </div>
      ),
      mobileLabel: 'Customer',
    },
    {
      key: 'driver',
      header: 'Driver',
      cell: (d) => (
        <span className="text-[13px] text-ink-body">{d.driver?.fullName ?? 'Unassigned'}</span>
      ),
      mobileLabel: 'Driver',
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      cell: (d) => (
        <span className="font-mono text-[13px] text-ink-body">
          {d.vehicle?.registrationNumber ?? '—'}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'created',
      header: 'Started',
      cell: (d) => (
        <span className="text-xs tabular-nums text-ink-muted">{timeAgo(d.dateCreated)}</span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'lifecycle',
      header: 'Lifecycle',
      cell: (d) => <DeliveryLifecycleStepper status={d.status} />,
      mobileLabel: 'Lifecycle',
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={deliveries}
        keyOf={(d) => d.deliveryId}
        loading={loading}
        pageSize={pageSize}
        emptyTitle="No active dispatches"
        emptyDescription="Allocate a pending order to start a delivery."
        rowActions={(d) => (
          <>
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Check className="size-3.5" />}
              onClick={() => void complete(d)}
              disabled={advance.isPending}
            >
              Complete
            </Button>
            <IconButton
              label={`Cancel ${d.trackingCode}`}
              onClick={() => setPendingCancel(d)}
              disabled={advance.isPending}
            >
              <X className="size-4" />
            </IconButton>
          </>
        )}
      />

      <AlertDialog
        open={pendingCancel !== null}
        onClose={() => setPendingCancel(null)}
        onConfirm={() => void confirmCancel()}
        title="Cancel this delivery?"
        description={
          pendingCancel
            ? `${pendingCancel.trackingCode} will be marked Cancelled and the assigned driver and vehicle returned to Available.`
            : ''
        }
        confirmLabel="Cancel delivery"
        cancelLabel="Keep active"
        variant="destructive"
        loading={advance.isPending}
      />
    </>
  );
}

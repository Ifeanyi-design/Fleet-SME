import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { DeliveryDetail } from '@/types/domain';
import { errorMessage } from '@/lib/errors';
import { useAdvanceDeliveryStatus } from '@/hooks/useMutations';
import { AlertDialog } from '@/components/ui/AlertDialog';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

/**
 * FR5 / PRD TC04 — one-touch delivery completion from the field.
 *
 * The PRD's driver screen lists "Start Trip" and "Confirm Delivery". Per the dispatch
 * logic (PRD §3.6.2 structured English + TC02), an order moves to In Progress the moment
 * it is allocated, so a separate "Start Trip" step would have no state to move from —
 * only completion (and pre-completion cancellation) remain, which is what this renders.
 * Buttons are ≥48px for gloved one-handed use (NFR3/NFR7).
 */

export interface StatusAdvanceButtonsProps {
  delivery: DeliveryDetail;
}

export function StatusAdvanceButtons({ delivery }: StatusAdvanceButtonsProps) {
  const advance = useAdvanceDeliveryStatus();
  const { toast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  async function complete() {
    try {
      await advance.mutateAsync({ deliveryId: delivery.deliveryId, status: 'delivered' });
      toast({
        variant: 'success',
        title: 'Delivery completed',
        description: `${delivery.trackingCode} marked Delivered.`,
      });
    } catch (err) {
      toast({ variant: 'error', title: 'Could not complete', description: errorMessage(err) });
    } finally {
      setConfirming(false);
    }
  }

  async function cancel() {
    try {
      await advance.mutateAsync({ deliveryId: delivery.deliveryId, status: 'cancelled' });
      toast({
        variant: 'warning',
        title: 'Delivery cancelled',
        description: `${delivery.trackingCode} marked Cancelled.`,
      });
    } catch (err) {
      toast({ variant: 'error', title: 'Could not cancel', description: errorMessage(err) });
    } finally {
      setCancelling(false);
    }
  }

  const busy = advance.isPending;

  return (
    <>
      <div className="space-y-2.5">
        <Button
          fullWidth
          size="lg"
          className="min-h-[52px] text-[15px]"
          leftIcon={<CheckCircle2 className="size-5" />}
          onClick={() => setConfirming(true)}
          disabled={busy}
        >
          Confirm Delivery
        </Button>
        <Button
          fullWidth
          size="lg"
          variant="ghost"
          className="min-h-[48px] text-state-error hover:bg-red-50"
          leftIcon={<XCircle className="size-5" />}
          onClick={() => setCancelling(true)}
          disabled={busy}
        >
          Report a problem
        </Button>
      </div>

      <AlertDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => void complete()}
        title="Confirm delivery"
        description={`Mark ${delivery.trackingCode} as Delivered? The recipient has received the package.`}
        confirmLabel="Yes, delivered"
        cancelLabel="Not yet"
        loading={busy}
      />

      <AlertDialog
        open={cancelling}
        onClose={() => setCancelling(false)}
        onConfirm={() => void cancel()}
        title="Cancel this delivery"
        description={`${delivery.trackingCode} will be cancelled and the vehicle released. Use this only if the delivery cannot be completed.`}
        confirmLabel="Cancel delivery"
        cancelLabel="Go back"
        variant="destructive"
        loading={busy}
      />
    </>
  );
}

import { useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDateTime, timeAgo } from '@/lib/formatters';
import { useDelivery } from '@/hooks/useDeliveries';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusPill } from '@/components/ui/StatusPill';
import { DeliveryLifecycleStepper } from '@/components/modules/dispatch/DeliveryLifecycleStepper';
import { StatusAdvanceButtons } from '@/components/modules/driver-app/StatusAdvanceButtons';
import { ClickToCallButton } from '@/components/modules/driver-app/ClickToCallButton';

/** Driver waybill detail — FR5 field execution view. */

export function DriverTrip() {
  const { deliveryId } = useParams<{ deliveryId: string }>();
  const id = Number(deliveryId);
  const query = useDelivery(id);

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <>
        <Link
          to="/driver"
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-700"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to my deliveries
        </Link>
        <Card flush>
          <EmptyState
            icon={<AlertCircle className="size-6" />}
            title="Waybill not found"
            description="This delivery may have been reassigned or removed."
          />
        </Card>
      </>
    );
  }

  const delivery = query.data;
  const recipientPhone = delivery.customer?.phone ?? '';

  return (
    <div className="space-y-4">
      <Link
        to="/driver"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-700 transition-colors hover:text-brand-800"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to my deliveries
      </Link>

      <Card className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle>{delivery.trackingCode}</CardTitle>
            <CardDescription>{delivery.customer?.name ?? 'Unknown customer'}</CardDescription>
          </div>
          <StatusPill status={delivery.status} />
        </div>

        <div className="mt-4 border-t border-hairline pt-4">
          <DeliveryLifecycleStepper status={delivery.status} />
        </div>
      </Card>

      <Card className="p-4">
        <dl className="space-y-3 text-[13px]">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Pickup
            </dt>
            <dd className="mt-1 text-ink-body">{delivery.pickupAddress}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Drop-off
            </dt>
            <dd className="mt-1 text-ink-body">{delivery.dropoffAddress}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Created
            </dt>
            <dd className="mt-1 tabular-nums text-ink-body">
              {formatDateTime(delivery.dateCreated)} · {timeAgo(delivery.dateCreated)}
            </dd>
          </div>
        </dl>
      </Card>

      {delivery.items.length > 0 && (
        <Card className="p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Cargo
          </p>
          <ul className="space-y-2">
            {delivery.items.map((item) => (
              <li
                key={item.productId}
                className="flex items-center justify-between gap-3 text-[13px]"
              >
                <span className="flex min-w-0 items-center gap-2 text-ink-body">
                  <Package className="size-4 shrink-0 text-ink-muted" aria-hidden />
                  <span className="truncate">{item.product?.productName ?? 'Item'}</span>
                </span>
                <span className="shrink-0 tabular-nums text-ink-primary">×{item.quantity}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {delivery.status === 'in_progress' && (
        <Card className="space-y-3 p-4">
          {recipientPhone && (
            <ClickToCallButton
              phoneNumber={recipientPhone}
              label={`Call ${delivery.customer?.name ?? 'recipient'}`}
              className="w-full"
            />
          )}
          <StatusAdvanceButtons delivery={delivery} />
        </Card>
      )}
    </div>
  );
}

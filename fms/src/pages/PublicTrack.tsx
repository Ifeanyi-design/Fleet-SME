import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PackageSearch, Search } from 'lucide-react';
import { isMockData } from '@/lib/api';
import { formatDateTime } from '@/lib/formatters';
import { useTracking } from '@/hooks/useTracking';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusPill } from '@/components/ui/StatusPill';
import { TrackingTimeline } from '@/components/modules/tracking/TrackingTimeline';

/** Public customer tracking (FR9 extend). No authentication required. */

function useExampleCodes() {
  return useQuery({
    queryKey: [...queryKeys.tracking('examples'), 'list'],
    queryFn: () => api.getExampleTrackingCodes(),
    enabled: isMockData,
    staleTime: 5 * 60_000,
  });
}

export function PublicTrack() {
  const { trackingCode } = useParams<{ trackingCode: string }>();
  const navigate = useNavigate();
  const [code, setCode] = useState(trackingCode ?? '');

  const query = useTracking(trackingCode ?? '');
  const examples = useExampleCodes();

  // Keep the input in sync when the URL changes (deep link or example click).
  useEffect(() => {
    setCode(trackingCode ?? '');
  }, [trackingCode]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length >= 4) {
      navigate(`/track/${encodeURIComponent(trimmed)}`);
    }
  }

  const notFound = Boolean(trackingCode) && !query.isLoading && !query.isError && !query.data;
  const tracking = query.data;

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h1 className="text-xl font-bold tracking-tight text-ink-primary">Track your delivery</h1>
        <p className="mt-1 text-[13px] text-ink-secondary">
          Enter the tracking code from your receipt to see the current status.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 sm:flex-row">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. FMS-7K2P9X"
            leftIcon={<PackageSearch className="size-4" />}
            aria-label="Tracking code"
            className="font-mono uppercase"
          />
          <Button
            type="submit"
            leftIcon={<Search className="size-4" />}
            className="shrink-0"
            disabled={code.trim().length < 4}
          >
            Track
          </Button>
        </form>

        {!trackingCode && isMockData && (examples.data?.length ?? 0) > 0 && (
          <div className="mt-4 border-t border-hairline pt-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Demo — try one of these
            </p>
            <div className="flex flex-wrap gap-2">
              {examples.data?.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => navigate(`/track/${example}`)}
                  className="rounded-full border border-hairline-strong bg-surface-sunken px-3 py-1.5 font-mono text-xs text-ink-body transition-colors hover:border-hairline-hover hover:bg-surface-hover"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {query.isLoading && (
        <Card className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="mt-2 h-40 w-full" />
        </Card>
      )}

      {query.isError && (
        <Card>
          <EmptyState
            icon={<PackageSearch className="size-6" />}
            title="Could not look up that code"
            description="Please check your connection and try again."
          />
        </Card>
      )}

      {notFound && (
        <Card>
          <EmptyState
            icon={<PackageSearch className="size-6" />}
            title="No delivery found"
            description={`We could not find a waybill for “${trackingCode}”. Check the code on your receipt and try again.`}
          />
        </Card>
      )}

      {tracking && (
        <>
          <Card>
            <div className="flex items-start justify-between gap-3 border-b border-hairline pb-4">
              <div className="min-w-0">
                <p className="font-mono text-base font-semibold text-ink-primary">
                  {tracking.trackingCode}
                </p>
                <p className="mt-0.5 text-[13px] text-ink-secondary">
                  {tracking.itemCount} {tracking.itemCount === 1 ? 'item' : 'items'} ·{' '}
                  {tracking.dropoffArea}
                </p>
              </div>
              <StatusPill status={tracking.status} />
            </div>

            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                  Order placed
                </dt>
                <dd className="mt-0.5 text-[13px] tabular-nums text-ink-body">
                  {formatDateTime(tracking.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                  Delivered
                </dt>
                <dd className="mt-0.5 text-[13px] tabular-nums text-ink-body">
                  {tracking.deliveredAt ? formatDateTime(tracking.deliveredAt) : '—'}
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h2 className="mb-4 text-base font-semibold tracking-[-0.01em] text-ink-primary">
              Status history
            </h2>
            <TrackingTimeline events={tracking.events} />
          </Card>

          <p className="text-center text-xs text-ink-muted">
            Questions about this delivery? Contact the courier directly.
          </p>
        </>
      )}
    </div>
  );
}

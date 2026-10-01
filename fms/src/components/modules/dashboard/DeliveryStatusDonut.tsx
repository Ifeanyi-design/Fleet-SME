import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, type TooltipProps } from 'recharts';
import type { DeliveryStatus } from '@/types/domain';
import { useMountAnimation } from '@/hooks/useMotionPreference';
import { statusLabel } from '@/components/ui/StatusPill';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatNumber } from '@/lib/formatters';

/** FR8 — delivery status distribution (style.md §6.6 donut tokens). */

const STATUS_ORDER: DeliveryStatus[] = ['delivered', 'in_progress', 'pending', 'cancelled'];

const STATUS_COLOR: Record<DeliveryStatus, string> = {
  delivered: '#16A34A',
  in_progress: '#3B82F6',
  pending: '#F59E0B',
  cancelled: '#6B7280',
};

function DonutTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];
  if (!entry) return null;
  return (
    <div className="rounded-lg bg-ink-primary px-2.5 py-1.5 text-xs text-white shadow-lg">
      <p className="font-medium">{String(entry.name)}</p>
      <p className="tabular-nums text-white/80">{entry.value} waybills</p>
    </div>
  );
}

export interface DeliveryStatusDonutProps {
  counts: Record<DeliveryStatus, number> | undefined;
  loading?: boolean;
}

export function DeliveryStatusDonut({ counts, loading = false }: DeliveryStatusDonutProps) {
  const animate = useMountAnimation();
  const data = counts
    ? STATUS_ORDER.map((status) => ({
        status,
        name: statusLabel(status),
        value: counts[status],
        color: STATUS_COLOR[status],
      })).filter((row) => row.value > 0)
    : [];

  const total = data.reduce((sum, row) => sum + row.value, 0);

  return (
    <Card>
      <div className="mb-2">
        <CardTitle>Status breakdown</CardTitle>
        <CardDescription>Delivery lifecycle distribution</CardDescription>
      </div>

      {loading || !counts ? (
        <Skeleton className="h-[240px] w-full" />
      ) : total === 0 ? (
        <div className="grid h-[240px] place-items-center text-sm text-ink-secondary">
          No deliveries in this period
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5">
          {/* Stacked, not side-by-side: in a 1/3-width column a flex-row leaves the
              legend so narrow that labels truncate to a single character. */}
          <div className="relative h-[170px] w-[170px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={74}
                  paddingAngle={2}
                  strokeWidth={0}
                  isAnimationActive={animate}
                  animationDuration={700}
                >
                  {data.map((row) => (
                    <Cell key={row.status} fill={row.color} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="text-center">
                <p className="text-2xl font-bold tabular-nums tracking-tight text-ink-primary">
                  {formatNumber(total)}
                </p>
                <p className="text-[11px] uppercase tracking-wider text-ink-muted">Waybills</p>
              </div>
            </div>
          </div>

          {/* Full width beneath the donut — no truncation, no compression. */}
          <ul className="w-full space-y-2.5">
            {data.map((row) => (
              <li key={row.status} className="flex items-center justify-between gap-3 text-[13px]">
                <span className="flex min-w-0 items-center gap-2 text-ink-body">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: row.color }}
                    aria-hidden
                  />
                  <span className="truncate">{row.name}</span>
                </span>
                {/* ── Count + percentage ────────────────────────────────────────
                    Percentage is now a soft pill (bg-surface-sunken rounded-full)
                    so it reads as a badge instead of bare text — cleaner hierarchy. */}
                <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
                  <span className="font-semibold tabular-nums text-ink-primary">
                    {formatNumber(row.value)}
                  </span>
                  <span className="rounded-full bg-surface-sunken px-1.5 py-0.5 text-xs font-medium text-ink-muted">
                    {Math.round((row.value / total) * 100)}%
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

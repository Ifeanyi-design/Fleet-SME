import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import type { DashboardMetrics } from '@/types/domain';
import { useMountAnimation } from '@/hooks/useMotionPreference';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

/** FR8 — delivery volume trend (style.md §6.6 chart tokens). */

function shortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function TrendTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const count = payload[0]?.value ?? 0;
  return (
    /* ── Chart tooltip: dark pill with stronger shadow ──────────────────────
       ring-1 ring-white/10 gives the floating tooltip a glass-border effect;
       shadow-pop ensures it pops above the chart canvas cleanly. */
    <div className="rounded-lg bg-ink-primary px-3 py-2 text-xs text-white shadow-pop ring-1 ring-white/10">
      <p className="font-semibold">{typeof label === 'string' ? shortDate(label) : ''}</p>
      <p className="tabular-nums text-white/70">{count} deliveries</p>
    </div>
  );
}

export interface DeliveryTrendChartProps {
  trend: DashboardMetrics['deliveryTrend'] | undefined;
  loading?: boolean;
  rangeLabel: string;
}

export function DeliveryTrendChart({ trend, loading = false, rangeLabel }: DeliveryTrendChartProps) {
  const animate = useMountAnimation();

  return (
    <Card>
      <div className="mb-4">
        <CardTitle>Delivery volume</CardTitle>
        <CardDescription>Waybills created over the last {rangeLabel}</CardDescription>
      </div>

      {loading || !trend ? (
        <Skeleton className="h-[240px] w-full" />
      ) : (
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
              <defs>
                {/* ── Richer gradient fill: 30% opacity at top (vs 22%) ────────
                    More visible fill gives the chart a fuller, premium look. */}
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              {/* ── Slightly darker grid lines for better readability ─────── */}
              <CartesianGrid stroke="#EAECF0" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={shortDate}
                tick={{ fontSize: 11, fill: '#94A3B8' }}
                axisLine={false}
                tickLine={false}
                minTickGap={24}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94A3B8' }}
                axisLine={false}
                tickLine={false}
                width={44}
                allowDecimals={false}
              />
              <Tooltip
                content={<TrendTooltip />}
                cursor={{ stroke: '#CBD5E1', strokeDasharray: '4 4' }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#22C55E"
                /* ── Slightly thicker stroke (2.5px) for a bolder chart line ─ */
                strokeWidth={2.5}
                fill="url(#trendFill)"
                isAnimationActive={animate}
                animationDuration={700}
                activeDot={{ r: 5, fill: '#16A34A', stroke: '#fff', strokeWidth: 2.5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

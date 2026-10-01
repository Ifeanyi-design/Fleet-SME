import { useMemo } from 'react';
import { RotateCcw, Search, X } from 'lucide-react';
import type { DeliveryStatus, Driver, Vehicle } from '@/types/domain';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { SegmentedControl, type SegmentedOption } from '@/components/ui/SegmentedControl';
import { FilterChips, type FilterOption } from '@/components/modules/shared/FilterBar';

/** FR8 — report filter bar: date window + fleet dimensions + status. */

export interface ReportFilterState {
  search: string;
  from: string;
  to: string;
  vehicleId: number | 'all';
  driverId: number | 'all';
  status: DeliveryStatus | 'all';
}

export const EMPTY_REPORT_FILTERS: ReportFilterState = {
  search: '',
  from: '',
  to: '',
  vehicleId: 'all',
  driverId: 'all',
  status: 'all',
};

type Preset = '7d' | '30d' | '90d' | 'all';

const PRESETS: SegmentedOption<Preset>[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'all', label: 'All time' },
];

const STATUS_OPTIONS: FilterOption<DeliveryStatus | 'all'>[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

function isoDaysAgo(days: number): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

/** Which preset (if any) the current from/to window corresponds to. */
function presetFor(from: string, to: string): Preset | null {
  if (!from && !to) return 'all';
  if (to && to !== new Date().toISOString().slice(0, 10)) return null;
  if (from === isoDaysAgo(6)) return '7d';
  if (from === isoDaysAgo(29)) return '30d';
  if (from === isoDaysAgo(89)) return '90d';
  return null;
}

export interface ReportFilterBarProps {
  value: ReportFilterState;
  onChange: (patch: Partial<ReportFilterState>) => void;
  onReset: () => void;
  vehicles: Vehicle[];
  drivers: Driver[];
}

export function ReportFilterBar({
  value,
  onChange,
  onReset,
  vehicles,
  drivers,
}: ReportFilterBarProps) {
  const activePreset = presetFor(value.from, value.to);

  const vehicleOptions = useMemo(
    () => [
      { value: 'all', label: 'All vehicles' },
      ...vehicles.map((v) => ({
        value: String(v.vehicleId),
        label: `${v.registrationNumber} — ${v.make} ${v.model}`,
      })),
    ],
    [vehicles],
  );

  const driverOptions = useMemo(
    () => [
      { value: 'all', label: 'All drivers' },
      ...drivers.map((d) => ({ value: String(d.driverId), label: d.fullName })),
    ],
    [drivers],
  );

  function applyPreset(preset: Preset) {
    if (preset === 'all') {
      onChange({ from: '', to: '' });
      return;
    }
    const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
    onChange({ from: isoDaysAgo(days - 1), to: new Date().toISOString().slice(0, 10) });
  }

  const isFiltered =
    value.search !== '' ||
    value.from !== '' ||
    value.to !== '' ||
    value.vehicleId !== 'all' ||
    value.driverId !== 'all' ||
    value.status !== 'all';

  return (
    <Card className="mb-6 space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="w-full lg:max-w-xs">
          <Input
            value={value.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Search waybill, customer or driver…"
            leftIcon={<Search className="size-4" />}
            rightSlot={
              value.search ? (
                <IconButton label="Clear search" onClick={() => onChange({ search: '' })}>
                  <X className="size-4" />
                </IconButton>
              ) : undefined
            }
            aria-label="Search report rows"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <SegmentedControl
            options={PRESETS}
            value={activePreset ?? 'all'}
            onChange={applyPreset}
            ariaLabel="Report date window"
          />
          {isFiltered && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium text-ink-secondary transition-colors hover:bg-surface-hover hover:text-ink-primary"
            >
              <RotateCcw className="size-3.5" aria-hidden />
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label
            htmlFor="reportFrom"
            className="mb-1.5 block text-[13px] font-medium text-ink-body"
          >
            From
          </label>
          <Input
            id="reportFrom"
            type="date"
            value={value.from}
            onChange={(e) => onChange({ from: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="reportTo" className="mb-1.5 block text-[13px] font-medium text-ink-body">
            To
          </label>
          <Input
            id="reportTo"
            type="date"
            value={value.to}
            onChange={(e) => onChange({ to: e.target.value })}
          />
        </div>
        <div>
          <label
            htmlFor="reportVehicle"
            className="mb-1.5 block text-[13px] font-medium text-ink-body"
          >
            Vehicle
          </label>
          <Select
            id="reportVehicle"
            options={vehicleOptions}
            value={String(value.vehicleId)}
            onChange={(e) =>
              onChange({ vehicleId: e.target.value === 'all' ? 'all' : Number(e.target.value) })
            }
          />
        </div>
        <div>
          <label
            htmlFor="reportDriver"
            className="mb-1.5 block text-[13px] font-medium text-ink-body"
          >
            Driver
          </label>
          <Select
            id="reportDriver"
            options={driverOptions}
            value={String(value.driverId)}
            onChange={(e) =>
              onChange({ driverId: e.target.value === 'all' ? 'all' : Number(e.target.value) })
            }
          />
        </div>
      </div>

      <FilterChips
        options={STATUS_OPTIONS}
        value={value.status}
        onChange={(status) => onChange({ status })}
      />
    </Card>
  );
}

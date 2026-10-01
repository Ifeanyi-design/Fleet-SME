import type { VehicleType } from '@/types/domain';

/** Human-readable labels for enum-ish domain values. */

const VEHICLE_TYPE_LABEL: Record<VehicleType, string> = {
  bike: 'Bike',
  trike: 'Trike',
  van: 'Van',
};

export function vehicleTypeLabel(type: VehicleType): string {
  return VEHICLE_TYPE_LABEL[type];
}

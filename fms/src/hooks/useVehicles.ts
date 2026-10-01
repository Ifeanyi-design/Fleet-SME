import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { VehicleFilters } from '@/lib/mockApi';

/** FR1 — vehicle asset reads. */
export function useVehicles(filters: VehicleFilters = {}) {
  return useQuery({
    queryKey: queryKeys.vehicles(filters),
    queryFn: () => api.listVehicles(filters),
    placeholderData: keepPreviousData,
  });
}

export function useVehicle(vehicleId: number) {
  return useQuery({
    queryKey: queryKeys.vehicle(vehicleId),
    queryFn: () => api.getVehicle(vehicleId),
    enabled: Number.isFinite(vehicleId),
  });
}

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { MaintenanceFilters } from '@/lib/mockApi';

/** FR6 — maintenance log reads. */
export function useMaintenance(filters: MaintenanceFilters = {}) {
  return useQuery({
    queryKey: queryKeys.maintenance(filters),
    queryFn: () => api.listMaintenance(filters),
    placeholderData: keepPreviousData,
  });
}

/** Service history for one vehicle (vehicle detail page). */
export function useMaintenanceForVehicle(vehicleId: number) {
  return useQuery({
    queryKey: queryKeys.maintenance({ vehicleId }),
    queryFn: () => api.listMaintenance({ vehicleId }),
    enabled: Number.isFinite(vehicleId),
  });
}

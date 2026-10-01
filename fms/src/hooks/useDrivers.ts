import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { DriverFilters } from '@/lib/mockApi';

/** FR2 — rider/driver registry reads. */
export function useDrivers(filters: DriverFilters = {}) {
  return useQuery({
    queryKey: queryKeys.drivers(filters),
    queryFn: () => api.listDrivers(filters),
    placeholderData: keepPreviousData,
  });
}

export function useDriver(driverId: number | null) {
  return useQuery({
    queryKey: queryKeys.driver(driverId ?? 0),
    queryFn: () => api.getDriver(driverId as number),
    enabled: driverId !== null && driverId > 0,
  });
}

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { DeliveryFilters } from '@/lib/mockApi';

/** FR3/FR4/FR5 — delivery reads. */
export function useDeliveries(filters: DeliveryFilters = {}) {
  return useQuery({
    queryKey: queryKeys.deliveries(filters),
    queryFn: () => api.listDeliveries(filters),
    placeholderData: keepPreviousData,
  });
}

/** A single delivery waybill (driver trip detail). */
export function useDelivery(deliveryId: number) {
  return useQuery({
    queryKey: queryKeys.delivery(deliveryId),
    queryFn: () => api.getDelivery(deliveryId),
    enabled: Number.isFinite(deliveryId),
  });
}

/** Deliveries belonging to one driver. Pass null while the principal is unknown. */
export function useDeliveriesForDriver(driverId: number | null) {
  return useQuery({
    queryKey: queryKeys.deliveries({ driverId }),
    queryFn: () => api.listDeliveries({ driverId: driverId ?? undefined }),
    enabled: driverId !== null && driverId > 0,
  });
}

/** Deliveries that used one vehicle (vehicle detail page). */
export function useDeliveriesForVehicle(vehicleId: number) {
  return useQuery({
    queryKey: queryKeys.deliveries({ vehicleId }),
    queryFn: () => api.listDeliveries({ vehicleId }),
    enabled: Number.isFinite(vehicleId),
  });
}

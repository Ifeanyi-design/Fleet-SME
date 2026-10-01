import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  DeliveryInput,
  DriverInput,
  MaintenanceInput,
  VehicleInput,
} from '@/lib/mockDb';
import type {
  Delivery,
  DeliveryDetail,
  DeliveryStatus,
  Driver,
  DriverStatus,
  Vehicle,
  VehicleStatus,
} from '@/types/domain';

/**
 * Write hooks. Server-state mutations invalidate the smallest affected keys
 * (plan.md §1.3); status toggles and dispatch additionally apply optimistic
 * updates so the UI reacts instantly and rolls back on failure (FR7).
 */

/* ── cache helpers ───────────────────────────────────────────────────────── */

/** Apply a patch to a vehicle in every cached vehicle list and detail entry. */
function patchVehicleInCache(queryClient: QueryClient, vehicleId: number, patch: Partial<Vehicle>) {
  queryClient.setQueriesData<Vehicle[] | Vehicle | null>({ queryKey: ['vehicles'] }, (old) => {
    if (Array.isArray(old)) {
      return old.map((v) => (v.vehicleId === vehicleId ? { ...v, ...patch } : v));
    }
    if (old && typeof old === 'object' && 'vehicleId' in old && old.vehicleId === vehicleId) {
      return { ...old, ...patch };
    }
    return old;
  });
}

function patchDriverInCache(queryClient: QueryClient, driverId: number, patch: Partial<Driver>) {
  queryClient.setQueriesData<Driver[] | Driver | null>({ queryKey: ['drivers'] }, (old) => {
    if (Array.isArray(old)) {
      return old.map((d) => (d.driverId === driverId ? { ...d, ...patch } : d));
    }
    if (old && typeof old === 'object' && 'driverId' in old && old.driverId === driverId) {
      return { ...old, ...patch };
    }
    return old;
  });
}

function patchDeliveryInCache(
  queryClient: QueryClient,
  deliveryId: number,
  patch: Partial<Delivery>,
) {
  queryClient.setQueriesData<DeliveryDetail[]>({ queryKey: ['deliveries'] }, (old) => {
    if (!Array.isArray(old)) return old;
    return old.map((d) => (d.deliveryId === deliveryId ? { ...d, ...patch } : d));
  });
}

/** Everything that can shift after a fleet write. */
function invalidateFleet(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ['vehicles'] });
  void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
}

function invalidateDispatch(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ['deliveries'] });
  void queryClient.invalidateQueries({ queryKey: ['vehicles'] });
  void queryClient.invalidateQueries({ queryKey: ['drivers'] });
  void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
}

/* ── vehicles ────────────────────────────────────────────────────────────── */

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: VehicleInput) => api.createVehicle(input),
    onSuccess: () => invalidateFleet(queryClient),
  });
}

/** FR1 — modify an existing vehicle record. */
export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vehicleId, input }: { vehicleId: number; input: Partial<VehicleInput> }) =>
      api.updateVehicle(vehicleId, input),
    onSuccess: () => invalidateFleet(queryClient),
  });
}

export function useSetVehicleStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vehicleId, status }: { vehicleId: number; status: VehicleStatus }) =>
      api.setVehicleStatus(vehicleId, status),
    onMutate: async ({ vehicleId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['vehicles'] });
      const previous = queryClient.getQueriesData({ queryKey: ['vehicles'] });
      patchVehicleInCache(queryClient, vehicleId, { status });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      // Roll back the optimistic patch.
      if (context?.previous) {
        for (const [key, data] of context.previous) queryClient.setQueryData(key, data);
      }
    },
    onSettled: () => invalidateFleet(queryClient),
  });
}

/* ── drivers ─────────────────────────────────────────────────────────────── */

export function useCreateDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DriverInput) => api.createDriver(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['drivers'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/** FR2 — update an existing driver profile. */
export function useUpdateDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ driverId, input }: { driverId: number; input: Partial<DriverInput> }) =>
      api.updateDriver(driverId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['drivers'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useSetDriverStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ driverId, status }: { driverId: number; status: DriverStatus }) =>
      api.setDriverStatus(driverId, status),
    onMutate: async ({ driverId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['drivers'] });
      const previous = queryClient.getQueriesData({ queryKey: ['drivers'] });
      patchDriverInCache(queryClient, driverId, { status });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        for (const [key, data] of context.previous) queryClient.setQueryData(key, data);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['drivers'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/* ── maintenance ─────────────────────────────────────────────────────────── */

export function useCreateMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MaintenanceInput) => api.createMaintenance(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/* ── deliveries ──────────────────────────────────────────────────────────── */

export function useCreateDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeliveryInput) => api.createDelivery(input),
    onSuccess: () => invalidateDispatch(queryClient),
  });
}

export function useAssignDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      deliveryId,
      driverId,
      vehicleId,
    }: {
      deliveryId: number;
      driverId: number;
      vehicleId: number;
    }) => api.assignDelivery(deliveryId, driverId, vehicleId),
    onSuccess: () => invalidateDispatch(queryClient),
  });
}

export function useAdvanceDeliveryStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ deliveryId, status }: { deliveryId: number; status: DeliveryStatus }) =>
      api.advanceDeliveryStatus(deliveryId, status),
    onMutate: async ({ deliveryId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['deliveries'] });
      const previous = queryClient.getQueriesData({ queryKey: ['deliveries'] });
      patchDeliveryInCache(queryClient, deliveryId, { status });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        for (const [key, data] of context.previous) queryClient.setQueryData(key, data);
      }
    },
    onSettled: () => invalidateDispatch(queryClient),
  });
}

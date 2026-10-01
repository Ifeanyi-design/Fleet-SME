/**
 * Centralised TanStack Query keys — prevents key drift across hooks and mutations.
 * Mutations invalidate the smallest affected key (see plan.md §1.3).
 */
export const queryKeys = {
  dashboard: (range: string) => ['dashboard', range] as const,

  vehicles: (filters?: Record<string, unknown>) => ['vehicles', filters ?? {}] as const,
  vehicle: (id: number) => ['vehicles', id] as const,

  drivers: (filters?: Record<string, unknown>) => ['drivers', filters ?? {}] as const,
  driver: (id: number) => ['drivers', id] as const,

  deliveries: (filters?: Record<string, unknown>) => ['deliveries', filters ?? {}] as const,
  delivery: (id: number) => ['deliveries', id] as const,
  pendingDeliveries: () => ['deliveries', { status: 'pending' }] as const,

  maintenance: (filters?: Record<string, unknown>) => ['maintenance', filters ?? {}] as const,

  reports: (filters?: Record<string, unknown>) => ['reports', filters ?? {}] as const,

  notifications: (filters?: Record<string, unknown>) => ['notifications', filters ?? {}] as const,
  notificationSummary: () => ['notifications', 'summary'] as const,

  customers: () => ['customers'] as const,
  products: () => ['products'] as const,

  tracking: (code: string) => ['tracking', code] as const,
} as const;

import { apiClient } from '@/lib/apiClient';
import { mockApi, type MockApi } from '@/lib/mockApi';
import type {
  AppNotification,
  Customer,
  CustomerImportResult,
  DashboardMetrics,
  Delivery,
  DeliveryDetail,
  DeliveryStatus,
  Driver,
  DriverStatus,
  MaintenanceLog,
  NotificationSummary,
  Product,
  PublicTracking,
  ReportResult,
  Vehicle,
  VehicleStatus,
} from '@/types/domain';
import type { MaintenanceRow } from '@/lib/mockApi';

/**
 * Single data-source switch for the whole app.
 *
 * Until the Flask backend is running, every call is served from the seed-backed mock.
 * Point `VITE_USE_MOCK=false` once the API is live and the identical interface is served
 * over HTTP — no component or hook changes needed.
 */
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

/** Real implementation — same contract, backed by the Flask REST API (plan.md §1.4). */
const realApi: MockApi = {
  /* reads */
  listVehicles: (filters = {}) =>
    apiClient.get<Vehicle[]>('/vehicles', {
      search: filters.search,
      status: filters.status === 'all' ? undefined : filters.status,
      type: filters.type === 'all' ? undefined : filters.type,
    }),

  getVehicle: (id) => apiClient.get<Vehicle | null>(`/vehicles/${id}`),

  listDrivers: (filters = {}) =>
    apiClient.get<Driver[]>('/drivers', {
      search: filters.search,
      status: filters.status === 'all' ? undefined : filters.status,
      expiringOnly: filters.expiringOnly,
    }),

  getDriver: (id) => apiClient.get<Driver | null>(`/drivers/${id}`),

  getDelivery: (id) => apiClient.get<DeliveryDetail | null>(`/deliveries/${id}`),

  listDeliveries: (filters = {}) =>
    apiClient.get<DeliveryDetail[]>('/deliveries', {
      search: filters.search,
      status: filters.status === 'all' ? undefined : filters.status,
      driverId: filters.driverId,
      vehicleId: filters.vehicleId,
      limit: filters.limit,
    }),

  listMaintenance: (filters = {}) =>
    apiClient.get<MaintenanceRow[]>('/maintenance', {
      search: filters.search,
      vehicleId: filters.vehicleId === 'all' ? undefined : filters.vehicleId,
    }),

  getCustomers: () => apiClient.get<Customer[]>('/customers'),
  createCustomer: (input) => apiClient.post<Customer>('/customers', input),
  updateCustomer: (customerId, input) =>
    apiClient.patch<Customer>(`/customers/${customerId}`, input),
  importCustomers: (customers) =>
    apiClient.post<CustomerImportResult>('/customers/import', { customers }),
  getProducts: () => apiClient.get<Product[]>('/products'),

  getDashboardMetrics: (range = '30d') =>
    apiClient.get<DashboardMetrics>('/dashboard/metrics', { range }),

  getReport: (filters = {}) =>
    apiClient.get<ReportResult>('/reports', {
      from: filters.from,
      to: filters.to,
      vehicleId: filters.vehicleId === 'all' ? undefined : filters.vehicleId,
      driverId: filters.driverId === 'all' ? undefined : filters.driverId,
      status: filters.status === 'all' ? undefined : filters.status,
      search: filters.search,
    }),

  getTracking: (trackingCode) =>
    apiClient.get<PublicTracking | null>(`/track/${encodeURIComponent(trackingCode)}`),

  /* notifications (FR9) */
  listNotifications: (filters = {}) =>
    apiClient.get<AppNotification[]>('/notifications', {
      category: filters.category === 'all' ? undefined : filters.category,
      unreadOnly: filters.unreadOnly,
      limit: filters.limit,
    }),

  getNotificationSummary: () => apiClient.get<NotificationSummary>('/notifications/summary'),

  markNotificationRead: (notificationId) =>
    apiClient.post<AppNotification>(`/notifications/${notificationId}/read`),

  markAllNotificationsRead: () =>
    apiClient.post<{ marked: number } & NotificationSummary>('/notifications/read-all'),

  /* writes */
  createVehicle: (input) => apiClient.post<Vehicle>('/vehicles', input),
  updateVehicle: (vehicleId, input) => apiClient.patch<Vehicle>(`/vehicles/${vehicleId}`, input),
  setVehicleStatus: (vehicleId, status: VehicleStatus) =>
    apiClient.patch<Vehicle>(`/vehicles/${vehicleId}`, { status }),

  createDriver: (input) => apiClient.post<Driver>('/drivers', input),
  updateDriver: (driverId, input) => apiClient.patch<Driver>(`/drivers/${driverId}`, input),
  setDriverStatus: (driverId, status: DriverStatus) =>
    apiClient.patch<Driver>(`/drivers/${driverId}`, { status }),

  createMaintenance: (input) => apiClient.post<MaintenanceLog>('/maintenance', input),

  createDelivery: (input) => apiClient.post<Delivery>('/deliveries', input),
  assignDelivery: (deliveryId, driverId, vehicleId) =>
    apiClient.post<Delivery>(`/deliveries/${deliveryId}/assign`, { driverId, vehicleId }),
  advanceDeliveryStatus: (deliveryId, next: DeliveryStatus) =>
    apiClient.patch<Delivery>(`/deliveries/${deliveryId}/status`, { status: next }),
};

export const api: MockApi = USE_MOCK ? mockApi : realApi;

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
  NotificationCategory,
  NotificationFilters,
  NotificationSeverity,
  NotificationSummary,
  PublicTracking,
  ReportResult,
  ReportSummary,
  TrackingEvent,
  Vehicle,
  VehicleStatus,
  VehicleType,
} from '@/types/domain';
import { ApiError } from '@/lib/apiClient';
import { db, dbMutations } from '@/lib/mockDb';
import type {
  DeliveryInput,
  DriverInput,
  MaintenanceInput,
  VehicleInput,
  CustomerInput,
} from '@/lib/mockDb';
import { daysUntil } from '@/lib/formatters';

/**
 * In-memory implementation of the REST contract (plan.md §1.4), backed by the mutable
 * mock database. `src/lib/api.ts` switches between this and the real HTTP client, so
 * hooks and components never know the difference.
 */

export type RangeKey = '7d' | '30d' | '90d';

// Type aliases (not interfaces) so they stay assignable to Record<string, unknown>
// when passed into TanStack Query keys.

export type VehicleFilters = {
  search?: string;
  status?: VehicleStatus | 'all';
  type?: VehicleType | 'all';
};

export type DriverFilters = {
  search?: string;
  status?: DriverStatus | 'all';
  expiringOnly?: boolean;
};

export type DeliveryFilters = {
  search?: string;
  status?: DeliveryStatus | 'all';
  driverId?: number;
  vehicleId?: number;
  /** Cap the number of rows returned (dashboard "recent" strip). */
  limit?: number;
};

export type MaintenanceFilters = {
  search?: string;
  vehicleId?: number | 'all';
};

/** FR8 — report filters (date window + fleet dimensions). */
export type ReportFilters = {
  from?: string;
  to?: string;
  vehicleId?: number | 'all';
  driverId?: number | 'all';
  status?: DeliveryStatus | 'all';
  search?: string;
};

/** A maintenance log joined with its vehicle, for table display. */
export type MaintenanceRow = MaintenanceLog & { vehicle: Vehicle | null };

/* ── helpers ─────────────────────────────────────────────────────────────── */

function delay<T>(value: T, ms = 260): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** Simulate a write round-trip. */
function mutate<T>(fn: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(fn());
      } catch (err) {
        reject(err);
      }
    }, 320);
  });
}

function matches(haystack: string[], term: string): boolean {
  const t = term.trim().toLowerCase();
  if (!t) return true;
  return haystack.some((h) => h.toLowerCase().includes(t));
}

function vehicleById(id: number | null): Vehicle | null {
  if (id === null) return null;
  return db.vehicles.find((v) => v.vehicleId === id) ?? null;
}

function driverById(id: number | null): Driver | null {
  if (id === null) return null;
  return db.drivers.find((d) => d.driverId === id) ?? null;
}

function customerById(id: number): DeliveryDetail['customer'] {
  return db.customers.find((c) => c.customerId === id) ?? null;
}

function toDetail(delivery: Delivery): DeliveryDetail {
  return {
    ...delivery,
    customer: customerById(delivery.customerId),
    driver: driverById(delivery.driverId),
    vehicle: vehicleById(delivery.vehicleId),
    items: db.deliveryItems
      .filter((item) => item.deliveryId === delivery.deliveryId)
      .map((item) => ({
        ...item,
        product: db.products.find((p) => p.productId === item.productId) ?? null,
      })),
  };
}

function rangeToDays(range: RangeKey): number {
  return range === '7d' ? 7 : range === '30d' ? 30 : 90;
}

/* ── notifications (mock parity with the Flask backend) ──────────────────── */

/** Internal shape carries the dedupe key; it is stripped before leaving the API. */
interface MockNotification extends AppNotification {
  dedupeKey: string | null;
}

const notificationStore: MockNotification[] = [];
let notificationSeq = 0;

const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  'dispatch',
  'maintenance',
  'compliance',
  'fleet',
];

function stripDedupe(notification: MockNotification): AppNotification {
  const { dedupeKey: _dedupeKey, ...rest } = notification;
  return rest;
}

function emitMockNotification(
  category: NotificationCategory,
  severity: NotificationSeverity,
  title: string,
  body = '',
  link: string | null = null,
  dedupeKey: string | null = null,
): void {
  if (dedupeKey !== null && notificationStore.some((n) => n.dedupeKey === dedupeKey)) return;
  notificationStore.unshift({
    notificationId: ++notificationSeq,
    category,
    severity,
    title,
    body,
    link,
    isRead: false,
    createdAt: new Date().toISOString(),
    readAt: null,
    dedupeKey,
  });
}

/** Materialise time-based alerts — idempotent, mirroring `sync_derived_notifications()`. */
function syncMockDerivedNotifications(): void {
  const latest = new Map<number, MaintenanceLog>();
  for (const log of db.maintenance) {
    const current = latest.get(log.vehicleId);
    if (!current || log.serviceDate > current.serviceDate) latest.set(log.vehicleId, log);
  }

  for (const [vehicleId, log] of latest) {
    const vehicle = db.vehicles.find((v) => v.vehicleId === vehicleId);
    if (!vehicle) continue;
    const days = daysUntil(log.nextDueDate);
    if (days > 14) continue;
    const overdue = days < 0;
    emitMockNotification(
      'maintenance',
      overdue ? 'error' : 'warning',
      `${vehicle.registrationNumber} service ${overdue ? 'overdue' : 'due'}`,
      overdue
        ? `Was due ${log.nextDueDate} — ${Math.abs(days)} day(s) late`
        : `Due ${log.nextDueDate} — in ${days} day(s)`,
      `/vehicles/${vehicleId}`,
      `service:${vehicleId}:${log.nextDueDate}`,
    );
  }

  for (const driver of db.drivers) {
    const days = daysUntil(driver.licenseExpiryDate);
    if (days > 30) continue;
    const expired = days < 0;
    emitMockNotification(
      'compliance',
      expired ? 'error' : 'warning',
      `${driver.fullName} licence ${expired ? 'expired' : 'expiring'}`,
      expired
        ? `Expired ${driver.licenseExpiryDate} — ${Math.abs(days)} day(s) ago`
        : `Expires ${driver.licenseExpiryDate} — in ${days} day(s)`,
      `/drivers/${driver.driverId}`,
      `licence:${driver.driverId}:${driver.licenseExpiryDate}`,
    );
  }
}

function notificationSummary(): NotificationSummary {
  const unread = notificationStore.filter((n) => !n.isRead);
  const unreadByCategory = NOTIFICATION_CATEGORIES.reduce(
    (acc, category) => ({ ...acc, [category]: 0 }),
    {} as Record<NotificationCategory, number>,
  );
  for (const notification of unread) unreadByCategory[notification.category] += 1;
  return { unread: unread.length, total: notificationStore.length, unreadByCategory };
}

/** FR8 — aggregate a filtered delivery set into report metrics. */
function computeSummary(
  rows: DeliveryDetail[],
  from: string | undefined,
  to: string | undefined,
): ReportSummary {
  const byStatus = rows.reduce<Record<DeliveryStatus, number>>(
    (acc, row) => {
      acc[row.status] += 1;
      return acc;
    },
    { pending: 0, in_progress: 0, delivered: 0, cancelled: 0 },
  );

  const closed = byStatus.delivered + byStatus.cancelled;
  const completionRate = closed === 0 ? 0 : Math.round((byStatus.delivered / closed) * 100);

  const totalItems = rows.reduce(
    (sum, row) => sum + row.items.reduce((n, item) => n + item.quantity, 0),
    0,
  );

  const uniqueCustomers = new Set(rows.map((row) => row.customerId)).size;

  const dates = rows.map((row) => row.dateCreated.slice(0, 10)).sort();
  const start = from ?? dates[0] ?? '';
  const end = to ?? dates[dates.length - 1] ?? '';
  const days =
    start && end
      ? Math.max(
          1,
          Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000) + 1,
        )
      : 1;

  return {
    total: rows.length,
    byStatus,
    completionRate,
    totalItems,
    uniqueCustomers,
    averagePerDay: Math.round((rows.length / days) * 10) / 10,
    from: start,
    to: end,
  };
}

const TRACKING_STEPS: { status: DeliveryStatus; label: string }[] = [
  { status: 'pending', label: 'Order received' },
  { status: 'in_progress', label: 'Out for delivery' },
  { status: 'delivered', label: 'Delivered' },
];

/** Build the public status timeline for a delivery. */
function buildTrackingEvents(delivery: Delivery): TrackingEvent[] {
  if (delivery.status === 'cancelled') {
    return [
      { status: 'pending', label: 'Order received', at: delivery.dateCreated, done: true },
      { status: 'cancelled', label: 'Cancelled', at: null, done: true },
    ];
  }

  const activeIndex = TRACKING_STEPS.findIndex((step) => step.status === delivery.status);

  return TRACKING_STEPS.map((step, index) => ({
    status: step.status,
    label: step.label,
    at:
      step.status === 'pending'
        ? delivery.dateCreated
        : step.status === 'delivered'
          ? delivery.dateDelivered
          : null,
    done: index <= activeIndex,
  }));
}

/* ── API surface ─────────────────────────────────────────────────────────── */

export const mockApi = {
  /* ── reads ───────────────────────────────────────────────────────────── */

  async listVehicles(filters: VehicleFilters = {}): Promise<Vehicle[]> {
    const { search = '', status = 'all', type = 'all' } = filters;
    const rows = db.vehicles
      .filter((v) => {
        if (status !== 'all' && v.status !== status) return false;
        if (type !== 'all' && v.vehicleType !== type) return false;
        return matches([v.registrationNumber, v.make, v.model], search);
      })
      .sort((a, b) => a.registrationNumber.localeCompare(b.registrationNumber));
    return delay(rows);
  },

  async getVehicle(id: number): Promise<Vehicle | null> {
    return delay(vehicleById(id));
  },

  async listDrivers(filters: DriverFilters = {}): Promise<Driver[]> {
    const { search = '', status = 'all', expiringOnly = false } = filters;
    const rows = db.drivers
      .filter((d) => {
        if (status !== 'all' && d.status !== status) return false;
        if (expiringOnly && daysUntil(d.licenseExpiryDate) > 30) return false;
        return matches([d.fullName, d.phoneNumber, d.licenseNumber], search);
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
    return delay(rows);
  },

  async getDriver(id: number): Promise<Driver | null> {
    return delay(driverById(id));
  },

  async listDeliveries(filters: DeliveryFilters = {}): Promise<DeliveryDetail[]> {
    const { search = '', status = 'all', driverId, vehicleId, limit } = filters;
    const rows = db.deliveries
      .filter((d) => status === 'all' || d.status === status)
      .filter((d) => driverId === undefined || d.driverId === driverId)
      .filter((d) => vehicleId === undefined || d.vehicleId === vehicleId)
      .map(toDetail)
      .filter((d) =>
        matches(
          [
            d.trackingCode,
            d.dropoffAddress,
            d.pickupAddress,
            d.customer?.name ?? '',
            d.driver?.fullName ?? '',
          ],
          search,
        ),
      )
      .sort((a, b) => (a.dateCreated < b.dateCreated ? 1 : -1));
    return delay(limit ? rows.slice(0, limit) : rows);
  },

  async getDelivery(id: number): Promise<DeliveryDetail | null> {
    const delivery = db.deliveries.find((d) => d.deliveryId === id);
    return delay(delivery ? toDetail(delivery) : null);
  },

  async listMaintenance(filters: MaintenanceFilters = {}): Promise<MaintenanceRow[]> {    const { search = '', vehicleId = 'all' } = filters;
    const rows = db.maintenance
      .map((log) => ({ ...log, vehicle: vehicleById(log.vehicleId) }))
      .filter((log) => vehicleId === 'all' || log.vehicleId === vehicleId)
      .filter((log) =>
        matches(
          [log.description, log.vehicle?.registrationNumber ?? '', log.vehicle?.make ?? ''],
          search,
        ),
      )
      .sort((a, b) => (a.serviceDate < b.serviceDate ? 1 : -1));
    return delay(rows);
  },

  async getCustomers() {
    return delay([...db.customers].sort((a, b) => a.name.localeCompare(b.name)));
  },

  async getProducts() {
    return delay([...db.products].sort((a, b) => a.productName.localeCompare(b.productName)));
  },

  async createCustomer(input: CustomerInput): Promise<Customer> {
    return mutate(() => dbMutations.createCustomer(input));
  },

  async updateCustomer(customerId: number, input: Partial<CustomerInput>): Promise<Customer> {
    return mutate(() => dbMutations.updateCustomer(customerId, input));
  },

  /** Per-row validation: good rows import, bad rows come back with their line number. */
  async importCustomers(customers: CustomerInput[]): Promise<CustomerImportResult> {
    return mutate(() => {
      let created = 0;
      let skipped = 0;
      const errors: Array<{ row: number; message: string }> = [];

      customers.forEach((row, index) => {
        try {
          dbMutations.createCustomer(row);
          created += 1;
        } catch (err) {
          if (err instanceof ApiError && err.code === 'CONFLICT') {
            skipped += 1;
          } else {
            errors.push({
              row: index + 1,
              message: err instanceof Error ? err.message : 'Invalid row.',
            });
          }
        }
      });

      return { total: customers.length, created, skipped, errors };
    });
  },

  async getDashboardMetrics(range: RangeKey = '30d'): Promise<DashboardMetrics> {
    const days = rangeToDays(range);

    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - (days - 1));
    const inRange = db.deliveries.filter((d) => new Date(d.dateCreated) >= cutoff);

    const deliveriesByStatus = inRange.reduce<Record<DeliveryStatus, number>>(
      (acc, d) => {
        acc[d.status] += 1;
        return acc;
      },
      { pending: 0, in_progress: 0, delivered: 0, cancelled: 0 },
    );

    const trend: DashboardMetrics['deliveryTrend'] = [];
    for (let offset = days - 1; offset >= 0; offset--) {
      const day = new Date();
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - offset);
      const key = day.toISOString().slice(0, 10);
      const count = inRange.filter((d) => d.dateCreated.slice(0, 10) === key).length;
      trend.push({ date: key, count });
    }

    const latestByVehicle = new Map<number, MaintenanceLog>();
    for (const log of db.maintenance) {
      const current = latestByVehicle.get(log.vehicleId);
      if (!current || log.serviceDate > current.serviceDate) latestByVehicle.set(log.vehicleId, log);
    }
    const serviceDueSoon = [...latestByVehicle.values()]
      .map((log) => {
        const vehicle = vehicleById(log.vehicleId);
        return vehicle
          ? { vehicle, nextDueDate: log.nextDueDate, overdue: daysUntil(log.nextDueDate) < 0 }
          : null;
      })
      .filter((row): row is DashboardMetrics['serviceDueSoon'][number] => row !== null)
      .filter((row) => daysUntil(row.nextDueDate) <= 14)
      .sort((a, b) => (a.nextDueDate < b.nextDueDate ? -1 : 1));

    const licensesExpiringSoon = db.drivers
      .map((driver) => ({ driver, daysLeft: daysUntil(driver.licenseExpiryDate) }))
      .filter((row) => row.daysLeft <= 30)
      .sort((a, b) => a.daysLeft - b.daysLeft);

    const onDelivery = db.vehicles.filter((v) => v.status === 'on_delivery').length;
    const operational = db.vehicles.filter((v) => v.status !== 'retired').length;

    const metrics: DashboardMetrics = {
      totalVehicles: db.vehicles.length,
      vehiclesAvailable: db.vehicles.filter((v) => v.status === 'available').length,
      vehiclesOnDelivery: onDelivery,
      vehiclesInMaintenance: db.vehicles.filter((v) => v.status === 'in_maintenance').length,
      assetUtilizationRate: operational ? Math.round((onDelivery / operational) * 100) : 0,
      totalDrivers: db.drivers.length,
      driversAvailable: db.drivers.filter((d) => d.status === 'available').length,
      driverAvailability: {
        available: db.drivers.filter((d) => d.status === 'available').length,
        on_delivery: db.drivers.filter((d) => d.status === 'on_delivery').length,
        off_duty: db.drivers.filter((d) => d.status === 'off_duty').length,
      },
      driverRoster: [...db.drivers].sort((a, b) => a.fullName.localeCompare(b.fullName)),
      deliveriesByStatus,
      maintenanceCostTotal: db.maintenance.reduce((sum, log) => sum + log.cost, 0),
      deliveryTrend: trend,
      serviceDueSoon,
      licensesExpiringSoon,
    };

    return delay(metrics, 320);
  },

  /** FR8 — filtered report rows plus server-computed summary metrics. */
  async getReport(filters: ReportFilters = {}): Promise<ReportResult> {
    const {
      from,
      to,
      vehicleId = 'all',
      driverId = 'all',
      status = 'all',
      search = '',
    } = filters;

    const rows = db.deliveries
      .filter((d) => !from || d.dateCreated.slice(0, 10) >= from)
      .filter((d) => !to || d.dateCreated.slice(0, 10) <= to)
      .filter((d) => vehicleId === 'all' || d.vehicleId === vehicleId)
      .filter((d) => driverId === 'all' || d.driverId === driverId)
      .filter((d) => status === 'all' || d.status === status)
      .map(toDetail)
      .filter((d) =>
        matches(
          [d.trackingCode, d.customer?.name ?? '', d.driver?.fullName ?? '', d.dropoffAddress],
          search,
        ),
      )
      .sort((a, b) => (a.dateCreated < b.dateCreated ? 1 : -1));

    return delay({ rows, summary: computeSummary(rows, from, to) }, 340);
  },

  /** FR9 — public tracking lookup. Returns a recipient-safe projection only. */
  async getTracking(trackingCode: string): Promise<PublicTracking | null> {
    const needle = trackingCode.trim().toUpperCase();
    const delivery = db.deliveries.find((d) => d.trackingCode.toUpperCase() === needle);
    if (!delivery) return delay(null, 300);

    const detail = toDetail(delivery);
    // General area only — never the full street address on a public page.
    const segments = delivery.dropoffAddress.split(',').map((part) => part.trim());
    const dropoffArea = segments.slice(-2).join(', ');

    return delay(
      {
        trackingCode: delivery.trackingCode,
        status: delivery.status,
        createdAt: delivery.dateCreated,
        deliveredAt: delivery.dateDelivered,
        dropoffArea,
        itemCount: detail.items.reduce((sum, item) => sum + item.quantity, 0),
        events: buildTrackingEvents(delivery),
      },
      300,
    );
  },

  /* ── notifications ───────────────────────────────────────────────────── */

  async listNotifications(filters: NotificationFilters = {}): Promise<AppNotification[]> {
    syncMockDerivedNotifications();
    const { category = 'all', unreadOnly = false, limit = 60 } = filters;
    let rows = [...notificationStore];
    if (category !== 'all') rows = rows.filter((n) => n.category === category);
    if (unreadOnly) rows = rows.filter((n) => !n.isRead);
    return delay(rows.slice(0, limit).map(stripDedupe));
  },

  async getNotificationSummary(): Promise<NotificationSummary> {
    syncMockDerivedNotifications();
    return delay(notificationSummary(), 120);
  },

  async markNotificationRead(notificationId: number): Promise<AppNotification> {
    return mutate(() => {
      const notification = notificationStore.find((n) => n.notificationId === notificationId);
      if (!notification) throw new ApiError(404, 'NOT_FOUND', 'Notification not found.');
      if (!notification.isRead) {
        notification.isRead = true;
        notification.readAt = new Date().toISOString();
      }
      return stripDedupe(notification);
    });
  },

  async markAllNotificationsRead(): Promise<{ marked: number } & NotificationSummary> {
    return mutate(() => {
      let marked = 0;
      const now = new Date().toISOString();
      for (const notification of notificationStore) {
        if (!notification.isRead) {
          notification.isRead = true;
          notification.readAt = now;
          marked += 1;
        }
      }
      return { marked, ...notificationSummary() };
    });
  },

  /* ── writes ──────────────────────────────────────────────────────────── */
  createVehicle: (input: VehicleInput) => mutate(() => dbMutations.createVehicle(input)),
  updateVehicle: (vehicleId: number, input: Partial<VehicleInput>) =>
    mutate(() => dbMutations.updateVehicle(vehicleId, input)),

  setVehicleStatus: (vehicleId: number, status: VehicleStatus) =>
    mutate(() => {
      const previous = db.vehicles.find((v) => v.vehicleId === vehicleId)?.status;
      const vehicle = dbMutations.setVehicleStatus(vehicleId, status);
      if (status === 'in_maintenance' && previous !== 'in_maintenance') {
        emitMockNotification(
          'fleet',
          'warning',
          `${vehicle.registrationNumber} taken off the road`,
          'Marked In Maintenance — unavailable for dispatch.',
          `/vehicles/${vehicleId}`,
        );
      } else if (previous === 'in_maintenance' && status === 'available') {
        emitMockNotification(
          'fleet',
          'success',
          `${vehicle.registrationNumber} back in service`,
          'Marked Available — can be dispatched again.',
          `/vehicles/${vehicleId}`,
        );
      }
      return vehicle;
    }),

  createDriver: (input: DriverInput) => mutate(() => dbMutations.createDriver(input)),
  setDriverStatus: (driverId: number, status: DriverStatus) =>
    mutate(() => dbMutations.setDriverStatus(driverId, status)),
  updateDriver: (driverId: number, input: Partial<DriverInput>) =>
    mutate(() => dbMutations.updateDriver(driverId, input)),

  createMaintenance: (input: MaintenanceInput) =>
    mutate(() => {
      const log = dbMutations.createMaintenance(input);
      const vehicle = db.vehicles.find((v) => v.vehicleId === log.vehicleId);
      if (vehicle) {
        emitMockNotification(
          'maintenance',
          'info',
          `Service logged for ${vehicle.registrationNumber}`,
          `${log.description} · next due ${log.nextDueDate}`,
          `/vehicles/${vehicle.vehicleId}`,
        );
      }
      return log;
    }),

  createDelivery: (input: DeliveryInput) =>
    mutate(() => {
      const delivery = dbMutations.createDelivery(input);
      const customer = db.customers.find((c) => c.customerId === delivery.customerId);
      emitMockNotification(
        'dispatch',
        'info',
        `New order ${delivery.trackingCode} awaiting allocation`,
        `${customer?.name ?? 'Customer'} · ${delivery.dropoffAddress}`,
        '/dispatch',
      );
      return delivery;
    }),

  assignDelivery: (deliveryId: number, driverId: number, vehicleId: number) =>
    mutate(() => {
      const delivery = dbMutations.assignDelivery(deliveryId, driverId, vehicleId);
      const driver = db.drivers.find((d) => d.driverId === driverId);
      const vehicle = db.vehicles.find((v) => v.vehicleId === vehicleId);
      emitMockNotification(
        'dispatch',
        'info',
        `${delivery.trackingCode} dispatched to ${driver?.fullName ?? 'driver'}`,
        `${vehicle?.registrationNumber ?? ''} · ${delivery.dropoffAddress}`,
        '/dispatch',
      );
      return delivery;
    }),

  advanceDeliveryStatus: (deliveryId: number, next: DeliveryStatus) =>
    mutate(() => {
      const delivery = dbMutations.advanceDeliveryStatus(deliveryId, next);
      if (next === 'delivered') {
        emitMockNotification(
          'dispatch',
          'success',
          `${delivery.trackingCode} delivered`,
          'The assigned driver and vehicle are available again.',
          '/dispatch',
        );
      } else if (next === 'cancelled') {
        emitMockNotification(
          'dispatch',
          'warning',
          `${delivery.trackingCode} cancelled`,
          'Any allocated resources were released.',
          '/dispatch',
        );
      } else {
        emitMockNotification(
          'dispatch',
          'info',
          `${delivery.trackingCode} is now ${next.replace('_', ' ')}`,
          'Delivery lifecycle updated.',
          '/dispatch',
        );
      }
      return delivery;
    }),
};

export type MockApi = typeof mockApi;

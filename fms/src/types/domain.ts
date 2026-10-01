/**
 * Domain model — mirrors the final 3NF relational schema in the PRD (Table 3.4).
 * Every entity and status here maps 1:1 to the database; statuses are string-literal
 * unions so illegal states are unrepresentable at compile time.
 */

/* ── Status unions ───────────────────────────────────────────────────────── */

/** VEHICLE.Status */
export type VehicleStatus = 'available' | 'on_delivery' | 'in_maintenance' | 'retired';

/** DRIVER.Status */
export type DriverStatus = 'available' | 'on_delivery' | 'off_duty';

/** DELIVERY.Status — lifecycle: Pending -> In Progress -> Delivered (or Cancelled) */
export type DeliveryStatus = 'pending' | 'in_progress' | 'delivered' | 'cancelled';

/** VEHICLE.VehicleType */
export type VehicleType = 'bike' | 'trike' | 'van';

/** Application roles (NFR2) */
export type UserRole = 'admin' | 'driver';

/* ── Entities ────────────────────────────────────────────────────────────── */

export interface Customer {
  customerId: number;
  name: string;
  phone: string;
  address: string;
}

/** Outcome of a bulk customer import (FR3). */
export interface CustomerImportResult {
  total: number;
  created: number;
  /** Rows that already existed (or repeated within the file). */
  skipped: number;
  errors: Array<{ row: number; message: string }>;
}

export interface Driver {
  driverId: number;
  fullName: string;
  phoneNumber: string;
  licenseNumber: string;
  /** ISO date (YYYY-MM-DD) */
  licenseExpiryDate: string;
  status: DriverStatus;
}

export interface Vehicle {
  vehicleId: number;
  registrationNumber: string;
  make: string;
  model: string;
  vehicleType: VehicleType;
  status: VehicleStatus;
  odometer: number;
}

export interface Delivery {
  deliveryId: number;
  customerId: number;
  driverId: number | null;
  vehicleId: number | null;
  /**
   * FR3 — the recipient's own details. The CUSTOMER is the sender, so the recipient is
   * not a customer record; these live on the delivery.
   */
  recipientName: string | null;
  recipientPhone: string | null;
  pickupAddress: string;
  dropoffAddress: string;
  status: DeliveryStatus;
  /** ISO datetime */
  dateCreated: string;
  /** ISO datetime, null until delivered */
  dateDelivered: string | null;
  /** Public tracking code (FR9) */
  trackingCode: string;
}

export interface Product {
  productId: number;
  productName: string;
  category: string;
}

export interface DeliveryItem {
  deliveryId: number;
  productId: number;
  quantity: number;
}

export interface MaintenanceLog {
  maintenanceId: number;
  vehicleId: number;
  /** ISO date */
  serviceDate: string;
  /** FR6 — odometer reading at service time (null for rows logged before it was captured). */
  odometer: number | null;
  description: string;
  cost: number;
  /** ISO date */
  nextDueDate: string;
}

/* ── Aggregate / view models ─────────────────────────────────────────────── */

/** A delivery joined with its customer, driver, and vehicle for table display. */
export interface DeliveryDetail extends Delivery {
  customer: Customer | null;
  driver: Driver | null;
  vehicle: Vehicle | null;
  items: Array<DeliveryItem & { product: Product | null }>;
}

/** FR8 — operational dashboard aggregate. */
export interface DashboardMetrics {
  totalVehicles: number;
  vehiclesAvailable: number;
  vehiclesOnDelivery: number;
  vehiclesInMaintenance: number;
  /** Percentage of the operational (non-retired) fleet currently deployed. */
  assetUtilizationRate: number;
  totalDrivers: number;
  driversAvailable: number;
  /** FR8 — driver availability broken down by status. */
  driverAvailability: Record<DriverStatus, number>;
  /** Table 3.6 — the driver roster with status, for dashboard badges. */
  driverRoster: Driver[];
  deliveriesByStatus: Record<DeliveryStatus, number>;
  maintenanceCostTotal: number;
  /** 7/30/90-day delivery counts for the trend chart */
  deliveryTrend: Array<{ date: string; count: number }>;
  /** Vehicles whose NextDueDate is within the alert window */
  serviceDueSoon: Array<{ vehicle: Vehicle; nextDueDate: string; overdue: boolean }>;
  /** Drivers whose licence expires within the alert window */
  licensesExpiringSoon: Array<{ driver: Driver; daysLeft: number }>;
}

/* ── Auth ────────────────────────────────────────────────────────────────── */

export interface AuthUser {
  userId: number;
  name: string;
  email: string;
  role: UserRole;
  /** DRIVER row behind a driver login. Null for administrators. */
  driverId: number | null;
  /** The linked driver record, embedded on login so the driver app needs no extra call. */
  driver?: Driver;
}

/* ── Reporting (FR8) ─────────────────────────────────────────────────────── */

export interface ReportSummary {
  total: number;
  byStatus: Record<DeliveryStatus, number>;
  /** delivered / (delivered + cancelled) — excludes orders still open. */
  completionRate: number;
  totalItems: number;
  uniqueCustomers: number;
  averagePerDay: number;
  /** ISO dates bounding the reported window. */
  from: string;
  to: string;
}

export interface ReportResult {
  rows: DeliveryDetail[];
  summary: ReportSummary;
}

/** Notification classification (FR9). */
export type NotificationCategory = 'dispatch' | 'maintenance' | 'compliance' | 'fleet';

/** Notification urgency — drives colour only, never behaviour. */
export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error';

/**
 * A stored, persistent notification.
 *
 * Read state lives on the row, so opening the bell does not make notifications vanish —
 * only an explicit "mark read" (or opening the item) does.
 */
export interface AppNotification {
  notificationId: number;
  category: NotificationCategory;
  severity: NotificationSeverity;
  title: string;
  body: string;
  /** In-app route this notification points at. */
  link: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationSummary {
  unread: number;
  total: number;
  unreadByCategory: Record<NotificationCategory, number>;
}

// Declared as a type alias (not an interface) so it stays assignable to
// Record<string, unknown> when passed into TanStack Query keys.
export type NotificationFilters = {
  category?: NotificationCategory | 'all';
  unreadOnly?: boolean;
  limit?: number;
};

/* ── Public tracking (FR9) ───────────────────────────────────────────────── */

export interface TrackingEvent {
  status: DeliveryStatus;
  label: string;
  at: string | null;
  done: boolean;
}

/**
 * Recipient-safe projection of a delivery.
 * Deliberately excludes driver identity, vehicle registration and the full pickup/drop-off
 * street address — a tracking code is guessable, so it must not leak internal records.
 */
export interface PublicTracking {
  trackingCode: string;
  status: DeliveryStatus;
  createdAt: string;
  deliveredAt: string | null;
  /** General area only (last segment of the drop-off address). */
  dropoffArea: string;
  itemCount: number;
  events: TrackingEvent[];
}

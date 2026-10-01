import type {
  Customer,
  Delivery,
  DeliveryItem,
  DeliveryStatus,
  Driver,
  DriverStatus,
  MaintenanceLog,
  Product,
  Vehicle,
  VehicleStatus,
  VehicleType,
} from '@/types/domain';
import {
  seedCustomers,
  seedDeliveries,
  seedDeliveryItems,
  seedDrivers,
  seedMaintenance,
  seedProducts,
  seedVehicles,
} from '@/data/seed';
import { ApiError } from '@/lib/apiClient';

/**
 * Mutable in-memory database backing the mock API.
 *
 * This is where the PRD's business rules live so they can be exercised before the
 * Flask/SQLAlchemy backend exists:
 *   - FR4/FR7  atomic dispatch allocation (availability checked, all writes together)
 *   - PRD TC03  resource-conflict rejection → ApiError(409, VEHICLE_UNAVAILABLE | DRIVER_UNAVAILABLE)
 *   - PRD TC02/TC04  delivery lifecycle state machine (Figure 3.13)
 *   - PRD TC01/TC05  unique registration / licence enforcement
 *
 * The real backend enforces the same rules inside a SQL transaction; the error codes
 * below are the contract the UI branches on.
 */

/* ── input shapes ────────────────────────────────────────────────────────── */

export interface VehicleInput {
  registrationNumber: string;
  make: string;
  model: string;
  vehicleType: VehicleType;
  odometer: number;
  status?: VehicleStatus;
}

export interface DriverInput {
  fullName: string;
  phoneNumber: string;
  licenseNumber: string;
  licenseExpiryDate: string;
  status?: DriverStatus;
}

export interface MaintenanceInput {
  vehicleId: number;
  serviceDate: string;
  /** FR6 — odometer reading at service time. */
  odometer: number | null;
  description: string;
  cost: number;
  nextDueDate: string;
}

export interface CustomerInput {
  name: string;
  phone: string;
  address: string;
}

export interface DeliveryItemInput {
  productId: number;
  quantity: number;
}

export interface DeliveryInput {
  customerId: number;
  /** FR3 — recipient details (the customer is the sender). */
  recipientName: string;
  recipientPhone: string;
  pickupAddress: string;
  dropoffAddress: string;
  items: DeliveryItemInput[];
}

/* ── state ───────────────────────────────────────────────────────────────── */

interface Db {
  vehicles: Vehicle[];
  drivers: Driver[];
  customers: Customer[];
  products: Product[];
  deliveries: Delivery[];
  deliveryItems: DeliveryItem[];
  maintenance: MaintenanceLog[];
  seq: {
    vehicle: number;
    driver: number;
    delivery: number;
    maintenance: number;
    customer: number;
  };
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function buildDb(): Db {
  return {
    vehicles: clone(seedVehicles),
    drivers: clone(seedDrivers),
    customers: clone(seedCustomers),
    products: clone(seedProducts),
    deliveries: clone(seedDeliveries),
    deliveryItems: clone(seedDeliveryItems),
    maintenance: clone(seedMaintenance),
    seq: {
      vehicle: Math.max(...seedVehicles.map((v) => v.vehicleId)),
      driver: Math.max(...seedDrivers.map((d) => d.driverId)),
      delivery: Math.max(...seedDeliveries.map((d) => d.deliveryId)),
      maintenance: Math.max(...seedMaintenance.map((m) => m.maintenanceId)),
      customer: Math.max(...seedCustomers.map((c) => c.customerId)),
    },
  };
}

export const db: Db = buildDb();

/** Restore the in-memory database to its seeded state (dev helper). */
export function resetDb(): void {
  const fresh = buildDb();
  db.vehicles = fresh.vehicles;
  db.drivers = fresh.drivers;
  db.customers = fresh.customers;
  db.products = fresh.products;
  db.deliveries = fresh.deliveries;
  db.deliveryItems = fresh.deliveryItems;
  db.maintenance = fresh.maintenance;
  db.seq = fresh.seq;
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

function uniqueTrackingCode(): string {
  let code = '';
  do {
    code = `FMS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  } while (db.deliveries.some((d) => d.trackingCode === code));
  return code;
}

/** The legal delivery transitions (PRD Figure 3.13). */
const ALLOWED_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  pending: ['in_progress', 'cancelled'],
  in_progress: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

function requireDelivery(deliveryId: number): Delivery {
  const delivery = db.deliveries.find((d) => d.deliveryId === deliveryId);
  if (!delivery) throw new ApiError(404, 'NOT_FOUND', 'Delivery not found.');
  return delivery;
}

function releaseResources(delivery: Delivery): void {
  if (delivery.driverId !== null) {
    const driver = db.drivers.find((d) => d.driverId === delivery.driverId);
    if (driver && driver.status === 'on_delivery') driver.status = 'available';
  }
  if (delivery.vehicleId !== null) {
    const vehicle = db.vehicles.find((v) => v.vehicleId === delivery.vehicleId);
    if (vehicle && vehicle.status === 'on_delivery') vehicle.status = 'available';
  }
}

/* ── mutations ───────────────────────────────────────────────────────────── */

export const dbMutations = {
  /** FR1 / PRD TC01 — register a vehicle; registration numbers are unique. */
  createVehicle(input: VehicleInput): Vehicle {
    const reg = input.registrationNumber.trim().toUpperCase();
    if (db.vehicles.some((v) => v.registrationNumber.toUpperCase() === reg)) {
      throw new ApiError(409, 'CONFLICT', `Vehicle ${reg} is already registered.`);
    }
    const vehicle: Vehicle = {
      vehicleId: ++db.seq.vehicle,
      registrationNumber: reg,
      make: input.make.trim(),
      model: input.model.trim(),
      vehicleType: input.vehicleType,
      status: input.status ?? 'available',
      odometer: input.odometer,
    };
    db.vehicles.push(vehicle);
    return vehicle;
  },

  setVehicleStatus(vehicleId: number, status: VehicleStatus): Vehicle {
    const vehicle = db.vehicles.find((v) => v.vehicleId === vehicleId);
    if (!vehicle) throw new ApiError(404, 'NOT_FOUND', 'Vehicle not found.');
    vehicle.status = status;
    return vehicle;
  },

  /** FR1 — modify a vehicle record. */
  updateVehicle(vehicleId: number, input: Partial<VehicleInput>): Vehicle {
    const vehicle = db.vehicles.find((v) => v.vehicleId === vehicleId);
    if (!vehicle) throw new ApiError(404, 'NOT_FOUND', 'Vehicle not found.');

    if (input.registrationNumber !== undefined) {
      const registration = input.registrationNumber.trim().toUpperCase();
      if (registration.length < 3) {
        throw new ApiError(422, 'VALIDATION_ERROR', 'Registration number is required.');
      }
      const clash = db.vehicles.some(
        (v) => v.vehicleId !== vehicleId && v.registrationNumber.toUpperCase() === registration,
      );
      if (clash) throw new ApiError(409, 'CONFLICT', `Vehicle ${registration} is already registered.`);
      vehicle.registrationNumber = registration;
    }
    if (input.make !== undefined) vehicle.make = input.make.trim();
    if (input.model !== undefined) vehicle.model = input.model.trim();
    if (input.vehicleType !== undefined) vehicle.vehicleType = input.vehicleType;
    if (input.status !== undefined) vehicle.status = input.status;
    if (input.odometer !== undefined) vehicle.odometer = input.odometer;

    return vehicle;
  },

  /** FR2 — enrol a driver; licence numbers are unique. */
  createDriver(input: DriverInput): Driver {
    const licence = input.licenseNumber.trim().toUpperCase();
    if (db.drivers.some((d) => d.licenseNumber.toUpperCase() === licence)) {
      throw new ApiError(409, 'CONFLICT', `Licence ${licence} is already on file.`);
    }
    const driver: Driver = {
      driverId: ++db.seq.driver,
      fullName: input.fullName.trim(),
      phoneNumber: input.phoneNumber.trim(),
      licenseNumber: licence,
      licenseExpiryDate: input.licenseExpiryDate,
      status: input.status ?? 'available',
    };
    db.drivers.push(driver);
    return driver;
  },

  setDriverStatus(driverId: number, status: DriverStatus): Driver {
    const driver = db.drivers.find((d) => d.driverId === driverId);
    if (!driver) throw new ApiError(404, 'NOT_FOUND', 'Driver not found.');
    driver.status = status;
    return driver;
  },

  /** FR2 — update a driver profile. */
  updateDriver(driverId: number, input: Partial<DriverInput>): Driver {
    const driver = db.drivers.find((d) => d.driverId === driverId);
    if (!driver) throw new ApiError(404, 'NOT_FOUND', 'Driver not found.');

    if (input.fullName !== undefined) {
      const fullName = input.fullName.trim();
      if (fullName.length < 2) {
        throw new ApiError(422, 'VALIDATION_ERROR', 'Full name is required.');
      }
      driver.fullName = fullName;
    }
    if (input.phoneNumber !== undefined) {
      const phone = input.phoneNumber.trim();
      if (phone.length < 7) {
        throw new ApiError(422, 'VALIDATION_ERROR', 'A valid phone number is required.');
      }
      driver.phoneNumber = phone;
    }
    if (input.licenseNumber !== undefined) {
      const licence = input.licenseNumber.trim().toUpperCase();
      if (licence.length < 4) {
        throw new ApiError(422, 'VALIDATION_ERROR', 'Licence number is required.');
      }
      const clash = db.drivers.some(
        (d) => d.driverId !== driverId && d.licenseNumber.toUpperCase() === licence,
      );
      if (clash) throw new ApiError(409, 'CONFLICT', `Licence ${licence} is already on file.`);
      driver.licenseNumber = licence;
    }
    if (input.licenseExpiryDate !== undefined) driver.licenseExpiryDate = input.licenseExpiryDate;
    if (input.status !== undefined) driver.status = input.status;

    return driver;
  },

  /**
   * FR3 — register a customer (the sending business).
   * Their address is the default pickup point for their waybills.
   */
  createCustomer(input: CustomerInput): Customer {
    const name = input.name.trim();
    const phone = input.phone.trim();
    const address = input.address.trim();

    const duplicate = db.customers.find(
      (c) => c.name.toLowerCase() === name.toLowerCase() && c.phone === phone,
    );
    if (duplicate) {
      throw new ApiError(409, 'CONFLICT', 'A customer with that name and phone already exists.');
    }

    const customer: Customer = {
      customerId: ++db.seq.customer,
      name,
      phone,
      address,
    };
    db.customers.push(customer);
    return customer;
  },

  updateCustomer(customerId: number, input: Partial<CustomerInput>): Customer {
    const customer = db.customers.find((c) => c.customerId === customerId);
    if (!customer) throw new ApiError(404, 'NOT_FOUND', 'Customer not found.');

    if (input.name !== undefined) {
      const name = input.name.trim();
      if (name.length < 2) {
        throw new ApiError(422, 'VALIDATION_ERROR', 'Customer name is required.');
      }
      customer.name = name;
    }
    if (input.phone !== undefined) {
      const phone = input.phone.trim();
      if (phone.length < 7) {
        throw new ApiError(422, 'VALIDATION_ERROR', 'A valid phone number is required.');
      }
      customer.phone = phone;
    }
    if (input.address !== undefined) {
      const address = input.address.trim();
      if (address.length < 5) {
        throw new ApiError(422, 'VALIDATION_ERROR', 'The pickup address is required.');
      }
      customer.address = address;
    }

    return customer;
  },

  /** FR6 / PRD TC05 — log a service event against a vehicle. */  createMaintenance(input: MaintenanceInput): MaintenanceLog {
    const vehicle = db.vehicles.find((v) => v.vehicleId === input.vehicleId);
    if (!vehicle) throw new ApiError(422, 'VALIDATION_ERROR', 'Select a valid vehicle.');
    const log: MaintenanceLog = {
      maintenanceId: ++db.seq.maintenance,
      vehicleId: input.vehicleId,
      serviceDate: input.serviceDate,
      odometer: input.odometer,
      description: input.description.trim(),
      cost: input.cost,
      nextDueDate: input.nextDueDate,
    };
    db.maintenance.push(log);
    return log;
  },

  /** FR3 — create a pending delivery order with its line items. */
  createDelivery(input: DeliveryInput): Delivery {
    const customer = db.customers.find((c) => c.customerId === input.customerId);
    if (!customer) throw new ApiError(422, 'VALIDATION_ERROR', 'Select a valid customer.');
    if (input.items.length === 0) {
      throw new ApiError(422, 'VALIDATION_ERROR', 'Add at least one line item.');
    }

    const delivery: Delivery = {
      deliveryId: ++db.seq.delivery,
      customerId: input.customerId,
      driverId: null,
      vehicleId: null,
      recipientName: input.recipientName.trim() || null,
      recipientPhone: input.recipientPhone.trim() || null,
      pickupAddress: input.pickupAddress.trim(),
      dropoffAddress: input.dropoffAddress.trim(),
      status: 'pending',
      dateCreated: new Date().toISOString(),
      dateDelivered: null,
      trackingCode: uniqueTrackingCode(),
    };
    db.deliveries.push(delivery);

    for (const item of input.items) {
      db.deliveryItems.push({
        deliveryId: delivery.deliveryId,
        productId: item.productId,
        quantity: item.quantity,
      });
    }

    return delivery;
  },

  /**
   * FR4 + FR7 / PRD TC02 & TC03 — atomic dispatch allocation.
   * All checks run before any write; the delivery, driver and vehicle flip together.
   */
  assignDelivery(deliveryId: number, driverId: number, vehicleId: number): Delivery {
    const delivery = requireDelivery(deliveryId);

    if (delivery.status !== 'pending') {
      throw new ApiError(
        409,
        'INVALID_STATE',
        'Delivery cannot be assigned: it is no longer pending.',
      );
    }

    const driver = db.drivers.find((d) => d.driverId === driverId);
    if (!driver) throw new ApiError(422, 'VALIDATION_ERROR', 'Select a valid driver.');
    if (driver.status !== 'available') {
      throw new ApiError(409, 'DRIVER_UNAVAILABLE', 'Selected driver is unavailable.');
    }

    const vehicle = db.vehicles.find((v) => v.vehicleId === vehicleId);
    if (!vehicle) throw new ApiError(422, 'VALIDATION_ERROR', 'Select a valid vehicle.');
    if (vehicle.status !== 'available') {
      throw new ApiError(
        409,
        'VEHICLE_UNAVAILABLE',
        'Vehicle is currently committed to an active dispatch.',
      );
    }

    // ── all checks passed: commit as one unit ──
    delivery.driverId = driverId;
    delivery.vehicleId = vehicleId;
    delivery.status = 'in_progress';
    driver.status = 'on_delivery';
    vehicle.status = 'on_delivery';

    return delivery;
  },

  /**
   * FR5 / PRD TC04 — advance the delivery lifecycle, guarded by the state machine.
   * Completion releases the driver and vehicle back to Available (FR7).
   */
  advanceDeliveryStatus(deliveryId: number, next: DeliveryStatus): Delivery {
    const delivery = requireDelivery(deliveryId);

    if (!ALLOWED_TRANSITIONS[delivery.status].includes(next)) {
      throw new ApiError(
        409,
        'INVALID_STATE',
        `Cannot move a ${delivery.status} delivery to ${next}.`,
      );
    }

    if (next === 'in_progress') {
      // Starting a trip requires allocated resources.
      if (delivery.driverId === null || delivery.vehicleId === null) {
        throw new ApiError(409, 'INVALID_STATE', 'Assign a driver and vehicle before starting.');
      }
    }

    delivery.status = next;
    if (next === 'delivered') {
      delivery.dateDelivered = new Date().toISOString();
      releaseResources(delivery);
    }
    if (next === 'cancelled') {
      releaseResources(delivery);
    }

    return delivery;
  },
};

export type DbMutations = typeof dbMutations;

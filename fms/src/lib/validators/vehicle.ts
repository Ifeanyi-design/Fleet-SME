import { z } from 'zod';

/** FR1 / PRD TC01 — vehicle registration form. */

export const VEHICLE_TYPES = ['bike', 'trike', 'van'] as const;
export const VEHICLE_STATUSES = ['available', 'on_delivery', 'in_maintenance', 'retired'] as const;

export const vehicleSchema = z.object({
  registrationNumber: z
    .string()
    .trim()
    .min(3, 'Enter a registration number')
    .max(20, 'Registration number is too long'),
  make: z.string().trim().min(1, 'Enter the make'),
  model: z.string().trim().min(1, 'Enter the model'),
  vehicleType: z.enum(VEHICLE_TYPES),
  odometer: z
    .number({ invalid_type_error: 'Enter the odometer reading' })
    .int('Whole numbers only')
    .min(0, 'Cannot be negative')
    .max(2_000_000, 'Value is too large'),
  status: z.enum(VEHICLE_STATUSES),
});

export type VehicleFormValues = z.infer<typeof vehicleSchema>;

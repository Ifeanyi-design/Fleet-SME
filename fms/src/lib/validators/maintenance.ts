import { z } from 'zod';

/** FR6 / PRD TC05 — preventive maintenance log form. */

export const maintenanceSchema = z
  .object({
    vehicleId: z
      .number({ invalid_type_error: 'Select a vehicle' })
      .int()
      .positive('Select a vehicle'),
    serviceDate: z.string().min(1, 'Select the service date'),
    /** FR6 — odometer reading at service time. Optional for legacy records. */
    odometer: z
      .number({ invalid_type_error: 'Enter the odometer reading' })
      .int('Whole numbers only')
      .min(0, 'Cannot be negative')
      .max(2_000_000, 'Value is too large')
      .nullable(),
    description: z.string().trim().min(3, 'Describe the work carried out').max(240, 'Description is too long'),
    cost: z
      .number({ invalid_type_error: 'Enter the cost' })
      .min(0, 'Cost cannot be negative')
      .max(100_000_000, 'Cost is too large'),
    nextDueDate: z.string().min(1, 'Select the next service date'),
  })
  .refine((data) => !data.serviceDate || !data.nextDueDate || data.nextDueDate >= data.serviceDate, {
    message: 'Next service must fall on or after the service date',
    path: ['nextDueDate'],
  });

export type MaintenanceFormValues = z.infer<typeof maintenanceSchema>;

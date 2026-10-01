import { z } from 'zod';

/** FR2 — driver enrolment form. */

export const DRIVER_STATUSES = ['available', 'on_delivery', 'off_duty'] as const;

export const driverSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter the full name').max(80, 'Name is too long'),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{7,17}$/, 'Enter a valid phone number (e.g. +2348038039526)'),
  licenseNumber: z.string().trim().min(4, 'Enter the licence number').max(24, 'Licence number is too long'),
  licenseExpiryDate: z.string().min(1, 'Select the licence expiry date'),
  status: z.enum(DRIVER_STATUSES),
});

export type DriverFormValues = z.infer<typeof driverSchema>;

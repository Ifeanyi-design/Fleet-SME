import { z } from 'zod';

/**
 * FR3 — customer (sender) registration.
 *
 * In this model the customer is the business sending the parcel: their registered
 * address is the default pickup point. The recipient is captured per waybill, because
 * the PRD's 3NF schema has no recipient entity.
 */
export const customerSchema = z.object({
  name: z.string().trim().min(2, 'Enter the customer name').max(120, 'Name is too long'),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{7,17}$/, 'Enter a valid phone number (e.g. +2348021114455)'),
  address: z
    .string()
    .trim()
    .min(5, 'Enter the pickup address')
    .max(200, 'Address is too long'),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

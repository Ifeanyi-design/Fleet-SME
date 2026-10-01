import { z } from 'zod';

/** FR3 — delivery order intake with line items (DELIVERY_ITEM rows). */

export const deliveryItemSchema = z.object({
  productId: z.number({ invalid_type_error: 'Select a product' }).int().positive('Select a product'),
  quantity: z
    .number({ invalid_type_error: 'Enter a quantity' })
    .int('Whole numbers only')
    .min(1, 'At least 1')
    .max(999, 'Quantity is too large'),
});

export const deliverySchema = z.object({
  customerId: z
    .number({ invalid_type_error: 'Select a customer' })
    .int()
    .positive('Select a customer'),
  /** FR3 — the recipient's own details (the customer is the sender). */
  recipientName: z.string().trim().max(120, 'Name is too long'),
  recipientPhone: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || /^\+?[0-9\s-]{7,17}$/.test(value),
      'Enter a valid phone number, or leave it blank',
    ),
  pickupAddress: z.string().trim().min(5, 'Enter the pickup address').max(160, 'Address is too long'),
  dropoffAddress: z.string().trim().min(5, 'Enter the drop-off address').max(160, 'Address is too long'),
  items: z.array(deliveryItemSchema).min(1, 'Add at least one line item'),
});

export type DeliveryFormValues = z.infer<typeof deliverySchema>;
export type DeliveryItemFormValues = z.infer<typeof deliveryItemSchema>;

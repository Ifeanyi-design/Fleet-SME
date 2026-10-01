import type { Delivery, DeliveryItem, DeliveryStatus } from '@/types/domain';
import { seedCustomers } from '@/data/seed/customers';
import { seedProducts } from '@/data/seed/products';
import { createRng, isoDateTime, pick, randInt } from '@/data/seed/util';

/**
 * Delivery waybills (FR3) generated deterministically across the last 45 days so the
 * Operations Dashboard trend chart (FR8) has a realistic shape and today's board has
 * a live mix of statuses. Case Organisation A runs ~20–30 deliveries/day at peak
 * (PRD §3.3.1).
 *
 * Status distribution:
 *   - past days  → Delivered (occasionally Cancelled)
 *   - today      → a mix of Pending, In Progress and Delivered
 */

/** Delivery addresses used as drop-off points around Lagos. */
const DROPOFF_ADDRESSES: readonly string[] = [
  '5 Ozumba Mbadiwe Ave, Victoria Island, Lagos',
  '31 Bode Thomas St, Surulere, Lagos',
  '9 Kudirat Abiola Way, Oregun, Ikeja, Lagos',
  '17 Adeola Odeku St, Victoria Island, Lagos',
  '2 Falomo Roundabout, Ikoyi, Lagos',
  '64 Ogunlana Drive, Surulere, Lagos',
  '11 Adebayo Adedeji Cres, Ikeja, Lagos',
  '28 Oba Akran Ave, Ikeja, Lagos',
  '6 Idejo St, Victoria Island, Lagos',
  '40 Herbert Macaulay Way, Yaba, Lagos',
];

const DAYS_BACK = 44;
const TODAY_OFFSET = 0;

/** FR3 — recipient details on each waybill (the customer is the sender). */
const RECIPIENTS: ReadonlyArray<readonly [string, string]> = [
  ['Ngozi Eze', '+2348031234567'],
  ['Bola Adeleke', '+2348062345678'],
  ['Ibrahim Suleiman', '+2348093456789'],
  ['Funke Akindele', '+2347014567890'],
  ['Chidi Obi', '+2348125678901'],
  ['Aisha Mohammed', '+2348146789012'],
];

function trackingCode(n: number): string {
  return `FMS-${(n * 2654435761 % 0xffffffff).toString(36).toUpperCase().padStart(6, '0').slice(0, 6)}`;
}

function buildDeliveries(): { deliveries: Delivery[]; items: DeliveryItem[] } {
  const rng = createRng(20261001);
  const deliveries: Delivery[] = [];
  const items: DeliveryItem[] = [];
  let id = 100;

  for (let dayOffset = -DAYS_BACK; dayOffset <= TODAY_OFFSET; dayOffset++) {
    // Older days carry slightly fewer jobs; peak days run 20–30.
    const isToday = dayOffset === 0;
    const volume = isToday ? randInt(16, 24, rng) : randInt(18, 30, rng);

    for (let i = 0; i < volume; i++) {
      id += 1;
      const customer = pick(seedCustomers, rng);
      const hour = randInt(7, 19, rng);
      const minute = randInt(0, 59, rng);

      let status: DeliveryStatus;
      if (isToday) {
        const roll = rng();
        status = roll < 0.3 ? 'pending' : roll < 0.55 ? 'in_progress' : 'delivered';
      } else {
        status = rng() < 0.08 ? 'cancelled' : 'delivered';
      }

      // Only dispatched jobs hold a driver + vehicle.
      const dispatched = status === 'in_progress' || status === 'delivered';
      const driverId = dispatched ? pick([1, 2, 3, 4, 6, 7], rng) : null;
      const vehicleId = dispatched ? pick([1, 2, 3, 5, 6, 7, 8], rng) : null;

      const recipient = pick(RECIPIENTS, rng);

      deliveries.push({
        deliveryId: id,
        customerId: customer.customerId,
        driverId,
        vehicleId,
        recipientName: recipient[0],
        recipientPhone: recipient[1],
        pickupAddress: customer.address,
        dropoffAddress: pick(DROPOFF_ADDRESSES, rng),
        status,
        dateCreated: isoDateTime(dayOffset, hour, minute),
        dateDelivered:
          status === 'delivered' ? isoDateTime(dayOffset, Math.min(hour + 1, 23), minute) : null,
        trackingCode: trackingCode(id),
      });

      // 1–3 line items per waybill.
      const lineCount = randInt(1, 3, rng);
      const used = new Set<number>();
      for (let l = 0; l < lineCount; l++) {
        const product = pick(seedProducts, rng);
        if (used.has(product.productId)) continue;
        used.add(product.productId);
        items.push({
          deliveryId: id,
          productId: product.productId,
          quantity: randInt(1, 4, rng),
        });
      }
    }
  }

  return { deliveries, items };
}

const generated = buildDeliveries();

export const seedDeliveries: Delivery[] = generated.deliveries;
export const seedDeliveryItems: DeliveryItem[] = generated.items;

import type { Product } from '@/types/domain';

/** Consignments carried by the courier — feeds DELIVERY_ITEM line items (FR3). */
export const seedProducts: Product[] = [
  { productId: 1, productName: 'Ankara Fabric Bundle', category: 'Apparel' },
  { productId: 2, productName: 'Ladies Handbag', category: 'Accessories' },
  { productId: 3, productName: 'Phone Charger', category: 'Electronics' },
  { productId: 4, productName: 'Packaged Meal (x4)', category: 'Food' },
  { productId: 5, productName: 'Antibiotics Pack', category: 'Pharmacy' },
  { productId: 6, productName: 'Skincare Set', category: 'Cosmetics' },
  { productId: 7, productName: 'Bluetooth Earbuds', category: 'Electronics' },
  { productId: 8, productName: 'Sneakers (Pair)', category: 'Footwear' },
];

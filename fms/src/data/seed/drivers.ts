import type { Driver } from '@/types/domain';
import { isoDate } from '@/data/seed/util';

/**
 * Rider/driver roster (FR2). Six regular riders plus one relief rider.
 * Licence expiry dates are relative to today so the compliance badges
 * (expired / expiring ≤30 days / valid) are always exercised:
 *   - Yusuf Bello   → expired
 *   - Emeka Nwosu   → expiring within 30 days
 *   - remainder     → valid
 */
export const seedDrivers: Driver[] = [
  {
    driverId: 1,
    fullName: 'Musa Ibrahim',
    phoneNumber: '+2348038039526',
    licenseNumber: 'DL-LAG-4471',
    licenseExpiryDate: isoDate(268),
    status: 'on_delivery',
  },
  {
    driverId: 2,
    fullName: 'Chinedu Okafor',
    phoneNumber: '+2348022447710',
    licenseNumber: 'DL-LAG-5512',
    licenseExpiryDate: isoDate(124),
    status: 'available',
  },
  {
    driverId: 3,
    fullName: 'Ayo Bakare',
    phoneNumber: '+2348113096620',
    licenseNumber: 'DL-LAG-3398',
    licenseExpiryDate: isoDate(402),
    status: 'available',
  },
  {
    driverId: 4,
    fullName: 'Emeka Nwosu',
    phoneNumber: '+2348055127743',
    licenseNumber: 'DL-LAG-6204',
    licenseExpiryDate: isoDate(19), // expiring soon
    status: 'available',
  },
  {
    driverId: 5,
    fullName: 'Yusuf Bello',
    phoneNumber: '+2348099871234',
    licenseNumber: 'DL-KJA-1180',
    licenseExpiryDate: isoDate(-16), // expired
    status: 'off_duty',
  },
  {
    driverId: 6,
    fullName: 'Tunde Adeyemi',
    phoneNumber: '+2347066553312',
    licenseNumber: 'DL-LAG-7789',
    licenseExpiryDate: isoDate(538),
    status: 'on_delivery',
  },
  {
    driverId: 7,
    fullName: 'Sani Garba',
    phoneNumber: '+2348144770099',
    licenseNumber: 'DL-ABJ-2205',
    licenseExpiryDate: isoDate(712),
    status: 'available',
  },
];

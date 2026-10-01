import type { Vehicle } from '@/types/domain';

/**
 * Case Organisation A baseline fleet — seven motorcycles including one backup unit
 * (PRD §3.3.1), plus one tricycle and one van as recent additions, so the
 * Bike / Trike / Van type filter (FR1) has real variety to work with.
 *
 * The first record matches PRD test case TC01 exactly (RegNo IBD-452-XY,
 * Bajaj Boxer BM150, 12,500 km) for traceability to the coursework test suite.
 */
export const seedVehicles: Vehicle[] = [
  {
    vehicleId: 1,
    registrationNumber: 'IBD-452-XY',
    make: 'Bajaj',
    model: 'Boxer BM150',
    vehicleType: 'bike',
    status: 'available',
    odometer: 12500,
  },
  {
    vehicleId: 2,
    registrationNumber: 'LAG-118-KJ',
    make: 'Bajaj',
    model: 'Boxer BM150',
    vehicleType: 'bike',
    status: 'on_delivery',
    odometer: 24800,
  },
  {
    vehicleId: 3,
    registrationNumber: 'LAG-204-AB',
    make: 'TVS',
    model: 'HLX 150',
    vehicleType: 'bike',
    status: 'available',
    odometer: 18200,
  },
  {
    vehicleId: 4,
    registrationNumber: 'KJA-771-QR',
    make: 'Jincheng',
    model: 'JC150',
    vehicleType: 'bike',
    status: 'in_maintenance',
    odometer: 31500,
  },
  {
    vehicleId: 5,
    registrationNumber: 'LAG-560-MN',
    make: 'Bajaj',
    model: 'Pulsar 150',
    vehicleType: 'bike',
    status: 'available',
    odometer: 9400,
  },
  {
    vehicleId: 6,
    registrationNumber: 'ABJ-330-ZZ',
    make: 'TVS',
    model: 'Metro Plus',
    vehicleType: 'bike',
    status: 'on_delivery',
    odometer: 27600,
  },
  {
    vehicleId: 7,
    registrationNumber: 'LAG-889-TT',
    make: 'Haojue',
    model: 'HJ150',
    vehicleType: 'bike',
    status: 'available',
    odometer: 12300,
  },
  {
    vehicleId: 8,
    registrationNumber: 'LAG-042-VX',
    make: 'Bajaj',
    model: 'Maxima Z',
    vehicleType: 'trike',
    status: 'available',
    odometer: 6800,
  },
  {
    vehicleId: 9,
    registrationNumber: 'LAG-901-LP',
    make: 'Toyota',
    model: 'Hiace',
    vehicleType: 'van',
    status: 'retired',
    odometer: 54200,
  },
];

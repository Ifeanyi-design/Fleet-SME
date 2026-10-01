import type { Customer } from '@/types/domain';

/**
 * Customer base (FR3) — reflects the Case Organisation A profile (PRD §3.3.1):
 * local online vendors, Instagram fashion brands, neighbourhood pharmacies and
 * food vendors across Lagos.
 */
export const seedCustomers: Customer[] = [
  {
    customerId: 1,
    name: 'Ada Fashion House',
    phone: '+2348021114455',
    address: '12 Adeniran Ogunsanya St, Surulere, Lagos',
  },
  {
    customerId: 2,
    name: 'HealthPlus Pharmacy',
    phone: '+2348092226611',
    address: '45 Awolowo Road, Ikoyi, Lagos',
  },
  {
    customerId: 3,
    name: 'Mama Cass Kitchen',
    phone: '+2347033338877',
    address: '7 Allen Avenue, Ikeja, Lagos',
  },
  {
    customerId: 4,
    name: 'Jumia Vendor Hub',
    phone: '+2348145552200',
    address: '3 Ligali Ayorinde St, Victoria Island, Lagos',
  },
  {
    customerId: 5,
    name: 'Bloom Beauty Store',
    phone: '+2348067779933',
    address: '22 Bode Thomas St, Surulere, Lagos',
  },
  {
    customerId: 6,
    name: 'TechMart NG',
    phone: '+2347018884411',
    address: '18 Opebi Road, Ikeja, Lagos',
  },
];

import type { MaintenanceLog } from '@/types/domain';
import { isoDate } from '@/data/seed/util';

/**
 * Workshop service history (FR6). Dates are relative to today so the preventive
 * service alerts (Figure 3.14 logic) always have overdue and due-soon examples.
 *
 * The first record mirrors PRD test case TC05 (Vehicle #01, engine oil & spark plug,
 * ₦18,500) for traceability. `odometer` is the reading at service time, required by FR6
 * but omitted from the Table 3.4 relation.
 */
export const seedMaintenance: MaintenanceLog[] = [
  {
    maintenanceId: 1,
    vehicleId: 1,
    serviceDate: isoDate(-42),
    odometer: 11200,
    description: 'Engine Oil & Spark Plug Replacement',
    cost: 18500,
    nextDueDate: isoDate(-6), // overdue
  },
  {
    maintenanceId: 2,
    vehicleId: 2,
    serviceDate: isoDate(-30),
    odometer: 23100,
    description: 'Brake pad replacement',
    cost: 9200,
    nextDueDate: isoDate(30),
  },
  {
    maintenanceId: 3,
    vehicleId: 3,
    serviceDate: isoDate(-21),
    odometer: 17400,
    description: 'Chain & sprocket service',
    cost: 7400,
    nextDueDate: isoDate(9), // due soon
  },
  {
    maintenanceId: 4,
    vehicleId: 4,
    serviceDate: isoDate(-12),
    odometer: 30800,
    description: 'Clutch plate overhaul',
    cost: 26500,
    nextDueDate: isoDate(48),
  },
  {
    maintenanceId: 5,
    vehicleId: 5,
    serviceDate: isoDate(-60),
    odometer: 8100,
    description: 'Rear tyre replacement',
    cost: 12800,
    nextDueDate: isoDate(-30), // overdue
  },
  {
    maintenanceId: 6,
    vehicleId: 6,
    serviceDate: isoDate(-18),
    odometer: 26900,
    description: 'Carburettor cleaning & tuning',
    cost: 5600,
    nextDueDate: isoDate(12), // due soon
  },
  {
    maintenanceId: 7,
    vehicleId: 7,
    serviceDate: isoDate(-9),
    odometer: 11900,
    description: 'General servicing & oil change',
    cost: 6800,
    nextDueDate: isoDate(21),
  },
  {
    maintenanceId: 8,
    vehicleId: 8,
    serviceDate: isoDate(-25),
    odometer: 6200,
    description: 'Rear axle lubrication',
    cost: 4900,
    nextDueDate: isoDate(5), // due soon
  },
  {
    maintenanceId: 9,
    vehicleId: 2,
    serviceDate: isoDate(-55),
    odometer: 19800,
    description: 'Engine top overhaul',
    cost: 42000,
    nextDueDate: isoDate(35),
  },
  {
    maintenanceId: 10,
    vehicleId: 3,
    serviceDate: isoDate(-6),
    odometer: 18100,
    description: 'Headlamp & wiring fix',
    cost: 8100,
    nextDueDate: isoDate(54),
  },
  {
    maintenanceId: 11,
    vehicleId: 4,
    serviceDate: isoDate(-48),
    odometer: 29600,
    description: 'Suspension bush replacement',
    cost: 15200,
    nextDueDate: isoDate(-18), // overdue
  },
  {
    maintenanceId: 12,
    vehicleId: 6,
    serviceDate: isoDate(-40),
    odometer: 24500,
    description: 'Speedometer cable replacement',
    cost: 3600,
    nextDueDate: isoDate(50),
  },
];

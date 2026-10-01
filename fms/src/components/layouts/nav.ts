import {
  BarChart3,
  Building2,
  History,
  LayoutDashboard,
  PackageSearch,
  Send,
  Truck,
  UserCircle,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@/types/domain';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Match nested routes as active (e.g. /vehicles/:id). */
  matchPrefix?: boolean;
  /** Open in a new tab (used for the public, chrome-less tracking page). */
  newTab?: boolean;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

/** Admin sidebar navigation (plan.md §2.0). */
export const ADMIN_NAV: NavSection[] = [
  {
    items: [{ label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Fleet',
    items: [
      { label: 'Vehicles', to: '/vehicles', icon: Truck, matchPrefix: true },
      { label: 'Drivers', to: '/drivers', icon: Users, matchPrefix: true },
      { label: 'Maintenance', to: '/maintenance', icon: Wrench },
    ],
  },
  {
    title: 'Dispatch',
    items: [
      { label: 'Dispatch Board', to: '/dispatch', icon: Send, matchPrefix: true },
      { label: 'Reports', to: '/reports', icon: BarChart3 },
    ],
  },
  {
    title: 'Customer',
    items: [
      { label: 'Customers', to: '/customers', icon: Building2, matchPrefix: true },
      // FR9 — the public tracking page customers reach from their receipt.
      // Opens in a new tab because it renders outside the admin shell.
      { label: 'Tracking page', to: '/track', icon: PackageSearch, newTab: true },
    ],
  },
];

/** Driver mobile bottom navigation (plan.md §2.0, DriverShell). */
export const DRIVER_NAV: NavItem[] = [
  { label: 'Today', to: '/driver', icon: Truck, matchPrefix: true },
  { label: 'History', to: '/driver/history', icon: History },
  { label: 'Profile', to: '/driver/profile', icon: UserCircle },
];

export function landingRouteFor(role: UserRole): string {
  return role === 'admin' ? '/dashboard' : '/driver';
}

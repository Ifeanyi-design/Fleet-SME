import { PackageSearch, ShieldAlert, Truck, Wrench, type LucideIcon } from 'lucide-react';
import type { BadgeVariant } from '@/components/ui/Badge';
import type { NotificationCategory, NotificationSeverity } from '@/types/domain';

/** Shared presentation for notifications (bell, page, toasts). */

export const CATEGORY_LABEL: Record<NotificationCategory, string> = {
  dispatch: 'Dispatch',
  maintenance: 'Maintenance',
  compliance: 'Compliance',
  fleet: 'Fleet',
};

export const CATEGORY_ICON: Record<NotificationCategory, LucideIcon> = {
  dispatch: PackageSearch,
  maintenance: Wrench,
  compliance: ShieldAlert,
  fleet: Truck,
};

export const SEVERITY_VARIANT: Record<NotificationSeverity, BadgeVariant> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error',
};

/** Icon chip colours, matching the badge variants. */
export const SEVERITY_CHIP: Record<NotificationSeverity, string> = {
  info: 'bg-blue-100 text-blue-700',
  success: 'bg-brand-100 text-brand-700',
  warning: 'bg-amber-100 text-amber-700',
  error: 'bg-red-100 text-red-700',
};

/** Relative time, compact enough for a notification row. */
export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

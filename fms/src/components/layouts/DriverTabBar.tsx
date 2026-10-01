import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { DRIVER_NAV } from '@/components/layouts/nav';

/** Driver bottom tab bar — mobile-first, ≥48px touch targets (plan.md §2.0). */
export function DriverTabBar() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-white/90 backdrop-blur-md"
      aria-label="Driver navigation"
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {DRIVER_NAV.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex min-h-[56px] flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors',
                  isActive ? 'text-brand-700' : 'text-ink-muted hover:text-ink-secondary',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn('size-5', isActive && 'stroke-[2.4]')} aria-hidden />
                  {item.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

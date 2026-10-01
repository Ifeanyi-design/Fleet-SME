import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut, Truck, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useUiStore } from '@/store/uiStore';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/IconButton';
import { ADMIN_NAV } from '@/components/layouts/nav';

/**
 * Mobile navigation drawer for the admin shell.
 * Animated with CSS (index.css) so the shell does not pull an animation library into
 * the initial bundle (NFR7). Rendered only while open, so nothing inside is focusable
 * when closed. Escape closes; focus moves into the panel on open.
 */
export function MobileNav() {
  const open = useUiStore((s) => s.mobileNavOpen);
  const setOpen = useUiStore((s) => s.setMobileNavOpen);
  const { user, logout } = useAuth();
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector<HTMLElement>('a, button')?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="animate-scrim-in absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <aside
        ref={panelRef}
        className="animate-drawer-in absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-surface shadow-pop"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        <div className="flex h-16 items-center justify-between border-b border-hairline px-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-chip bg-brand-600 text-white">
              <Truck className="size-5" aria-hidden />
            </span>
            <p className="text-sm font-semibold tracking-tight text-ink-primary">FleetMS</p>
          </div>
          <IconButton label="Close navigation" onClick={() => setOpen(false)}>
            <X className="size-5" />
          </IconButton>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {ADMIN_NAV.map((section, i) => (
            <div key={section.title ?? `s-${i}`}>
              {section.title && (
                <p className="px-3 pb-1.5 pt-5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                  {section.title}
                </p>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const itemClass =
                    'flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition-colors';
                  const idleClass = 'text-ink-secondary hover:bg-surface-hover hover:text-ink-primary';

                  return (
                    <li key={item.to}>
                      {item.newTab ? (
                        <a
                          href={item.to}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => setOpen(false)}
                          className={cn(itemClass, idleClass)}
                        >
                          <item.icon className="size-5 shrink-0" aria-hidden />
                          {item.label}
                        </a>
                      ) : (
                        <NavLink
                          to={item.to}
                          onClick={() => setOpen(false)}
                          className={({ isActive }) =>
                            cn(
                              itemClass,
                              isActive
                                ? 'bg-brand-50 font-semibold text-brand-700'
                                : idleClass,
                            )
                          }
                        >
                          <item.icon className="size-5 shrink-0" aria-hidden />
                          {item.label}
                        </NavLink>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2.5 border-t border-hairline p-4">
          <Avatar name={user?.name ?? 'User'} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-ink-primary">{user?.name}</p>
            <p className="truncate text-[11px] capitalize text-ink-muted">{user?.role}</p>
          </div>
          <IconButton label="Sign out" onClick={logout}>
            <LogOut className="size-4" />
          </IconButton>
        </div>
      </aside>
    </div>
  );
}

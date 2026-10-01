import { NavLink } from 'react-router-dom';
import { LogOut, PanelLeftClose, PanelLeftOpen, Truck } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useUiStore } from '@/store/uiStore';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/IconButton';
import { ADMIN_NAV } from '@/components/layouts/nav';

/**
 * style.md §6.5 — sidebar navigation rail. w-60 expanded / w-[72px] collapsed.
 *
 * Sticky + h-screen + self-start so the rail pins to the viewport instead of stretching
 * with the page: the footer (sign out / collapse) stays reachable on long screens, and
 * only the nav list scrolls when it overflows.
 *
 * Visual upgrade: gradient brand icon, richer active nav bg + indicator,
 * section labels refined, footer border elevated.
 */
export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const { user, logout } = useAuth();

  return (
    <aside
      className={cn(
        'sticky top-0 z-20 hidden h-screen shrink-0 self-start flex-col overflow-hidden border-r border-hairline bg-surface transition-[width] duration-200 ease-out lg:flex',
        collapsed ? 'w-[72px]' : 'w-60',
      )}
    >
      {/* ── Brand ─────────────────────────────────────────────────────────────
          Icon uses the brand gradient so the sidebar header anchors the brand
          colour across collapsed/expanded states (pattern from NexaFleet). */}
      <div className={cn('flex h-16 items-center gap-2.5 border-b border-hairline px-4', collapsed && 'justify-center px-0')}>
        <span className="grid size-9 shrink-0 place-items-center rounded-chip bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-xs">
          <Truck className="size-5" aria-hidden />
        </span>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight text-ink-primary">FleetMS</p>
            {/* Sub-label: slightly more muted to create clear hierarchy */}
            <p className="truncate text-[11px] font-medium text-ink-muted">Delivery Operations</p>
          </div>
        )}
      </div>

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {ADMIN_NAV.map((section, i) => (
          <div key={section.title ?? `section-${i}`}>
            {section.title && !collapsed && (
              /* Section label: uppercase + wider tracking for clear grouping */
              <p className="px-3 pb-1.5 pt-5 text-[10px] font-bold uppercase tracking-[0.08em] text-ink-disabled">
                {section.title}
              </p>
            )}
            {section.title && collapsed && <div className="my-3 border-t border-hairline" />}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const content = (isActive: boolean) => (
                  <>
                    {isActive && (
                      /* Active indicator: rounded-full pill vs old square bar —
                         more modern, inspired by Cureer sidebar */
                      <span
                        className="absolute left-0 h-5 w-[3px] rounded-r-full bg-brand-600"
                        aria-hidden
                      />
                    )}
                    <item.icon className="size-5 shrink-0" aria-hidden />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </>
                );

                const itemClass = (isActive: boolean) =>
                  cn(
                    'group relative flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    collapsed && 'justify-center px-0',
                    isActive
                      /* Active: gradient tint bg instead of flat brand-50 —
                         more refined than the old solid fill */
                      ? 'bg-gradient-to-r from-brand-50 to-brand-50/0 font-semibold text-brand-700'
                      : 'text-ink-secondary hover:bg-surface-hover hover:text-ink-primary',
                  );

                return (
                  <li key={item.to}>
                    {item.newTab ? (
                      <a
                        href={item.to}
                        target="_blank"
                        rel="noreferrer"
                        title={collapsed ? item.label : undefined}
                        className={itemClass(false)}
                      >
                        {content(false)}
                      </a>
                    ) : (
                      <NavLink
                        to={item.to}
                        title={collapsed ? item.label : undefined}
                        className={({ isActive }) => itemClass(isActive)}
                      >
                        {({ isActive }) => content(isActive)}
                      </NavLink>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── Footer: user + collapse ──────────────────────────────────────────
          Slightly stronger border and bg for visual separation from nav. */}
      <div className="border-t border-hairline/strong bg-surface-sunken p-3">
        <div className={cn('flex items-center gap-2.5', collapsed && 'justify-center')}>
          <Avatar name={user?.name ?? 'User'} size="sm" />
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-ink-primary">{user?.name}</p>
                <p className="truncate text-[11px] capitalize text-ink-muted">{user?.role}</p>
              </div>
              <IconButton label="Sign out" onClick={logout}>
                <LogOut className="size-4" />
              </IconButton>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={toggleSidebar}
          className={cn(
            'mt-3 hidden w-full items-center gap-2 rounded-control px-3 py-2 text-[13px] font-medium text-ink-secondary transition-colors hover:bg-surface-hover hover:text-ink-primary lg:flex',
            collapsed && 'justify-center px-0',
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" aria-hidden />
          ) : (
            <>
              <PanelLeftClose className="size-4" aria-hidden />
              Collapse
            </>
          )}
        </button>
      </div>
    </aside>
  );
}


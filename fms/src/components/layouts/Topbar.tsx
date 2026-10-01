import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, Search, UserCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useUiStore } from '@/store/uiStore';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { NotificationBell } from '@/components/layouts/NotificationBell';

/** Topbar — h-16, sticky, glass over content (style.md §5.3). */

export function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    /* ── Glass topbar ────────────────────────────────────────────────────────
       white/90 + backdrop-blur-md gives the "frosted" glass effect seen in
       the Cureer and NexaFleet reference UIs. Added a stronger bottom border
       (border-hairline/strong) so the topbar feels crisper against the canvas. */
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-hairline bg-white/90 px-4 shadow-xs backdrop-blur-md lg:px-6">
      <IconButton label="Open navigation" className="lg:hidden" onClick={() => setMobileNavOpen(true)}>
        <Menu className="size-5" />
      </IconButton>

      <div className="hidden max-w-md flex-1 md:block">
        <Input
          inputSize="lg"
          placeholder="Search vehicles, drivers, waybills…"
          leftIcon={<Search className="size-4" />}
          aria-label="Search"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const term = e.currentTarget.value.trim();
              navigate(term ? `/reports?q=${encodeURIComponent(term)}` : '/reports');
            }
          }}
        />
      </div>

      {/* Spacer that always consumes the leftover width. The search box is flex-1 but
          capped at max-w-md, so without this the right-hand items would stop short of the
          right edge on wide screens. */}
      <div className="flex-1" aria-hidden />

      <NotificationBell />

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          /* ── Avatar button: ring on hover adds a premium feel ──────────────
             ring-2 ring-brand-500/20 on hover creates a subtle halo that anchors
             the avatar as a clickable target without being intrusive. */
          className="flex items-center gap-2 rounded-control p-1 pr-2 transition-all duration-150 hover:bg-surface-hover hover:ring-2 hover:ring-brand-500/20"
        >
          <Avatar name={user?.name ?? 'User'} size="sm" />
          <span className="hidden text-[13px] font-medium text-ink-primary sm:block">
            {user?.name}
          </span>
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-panel border border-hairline bg-surface py-1 shadow-pop"
          >
            <div className="border-b border-hairline px-3.5 py-2.5">
              <p className="truncate text-[13px] font-semibold text-ink-primary">{user?.name}</p>
              <p className="truncate text-xs text-ink-muted">{user?.email}</p>
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                navigate('/profile');
              }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-ink-body transition-colors hover:bg-surface-hover"
            >
              <UserCircle className="size-4 text-ink-muted" aria-hidden />
              Profile
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={logout}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-state-error transition-colors hover:bg-red-50"
            >
              <LogOut className="size-4" aria-hidden />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

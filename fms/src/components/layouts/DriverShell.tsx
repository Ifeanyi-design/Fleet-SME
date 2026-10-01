import { Suspense } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Truck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/IconButton';
import { DriverTabBar } from '@/components/layouts/DriverTabBar';
import { RouteFallbackPlain } from '@/components/layouts/RouteFallback';

/**
 * Driver shell — mobile-first, data-efficient (NFR7).
 * Compact sticky topbar + content + bottom tab bar.
 */
export function DriverShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-hairline bg-white/85 px-4 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-chip bg-brand-600 text-white">
            <Truck className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-ink-primary">My Deliveries</p>
            <p className="truncate text-[11px] text-ink-muted">{user?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Avatar name={user?.name ?? 'Driver'} size="sm" />
          <IconButton label="Sign out" onClick={handleLogout}>
            <LogOut className="size-4" />
          </IconButton>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1 px-4 py-4 pb-24">
        <div className="mx-auto w-full max-w-lg">
          <div key={location.pathname} className="animate-fade-in-up">
            <Suspense fallback={<RouteFallbackPlain />}>
              <Outlet />
            </Suspense>
          </div>
        </div>
      </main>

      <DriverTabBar />
    </div>
  );
}

import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/layouts/Sidebar';
import { Topbar } from '@/components/layouts/Topbar';
import { MobileNav } from '@/components/layouts/MobileNav';
import { NotificationWatcher } from '@/components/layouts/NotificationWatcher';
import { RouteFallback } from '@/components/layouts/RouteFallback';

/** Admin shell: sidebar + topbar + scrollable content area (plan.md §2.0). */
export function AppShell() {
  const location = useLocation();

  // Reset scroll between pages — the window is the scroll container here.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-canvas">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-control focus:bg-surface focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-ink-primary focus:shadow-lg"
      >
        Skip to content
      </a>

      <Sidebar />
      <MobileNav />
      {/* Raises a toast when a new notification arrives while the app is open (FR9). */}
      <NotificationWatcher />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main id="main-content" tabIndex={-1} className="flex-1 p-4 lg:p-8">
          <div className="mx-auto w-full max-w-[1400px]">
            <div key={location.pathname} className="animate-fade-in-up">
              <Suspense fallback={<RouteFallback />}>
                <Outlet />
              </Suspense>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

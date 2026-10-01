import { Suspense } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Truck } from 'lucide-react';
import { RouteFallbackPlain } from '@/components/layouts/RouteFallback';

/** Public layout for the customer tracking page (FR9). */
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="flex h-16 items-center border-b border-hairline bg-surface px-4 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-chip bg-brand-600 text-white">
            <Truck className="size-5" aria-hidden />
          </span>
          <span className="text-sm font-semibold tracking-tight text-ink-primary">FleetMS</span>
        </Link>
      </header>
      <main id="main-content" className="flex flex-1 items-start justify-center px-4 py-10">
        <div className="w-full max-w-xl">
          <Suspense fallback={<RouteFallbackPlain />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
      <footer className="border-t border-hairline bg-surface py-5 text-center text-xs text-ink-muted">
        Fleet Management System · SME Delivery Operations
      </footer>
    </div>
  );
}

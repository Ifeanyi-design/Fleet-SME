import { Outlet } from 'react-router-dom';
import { Truck } from 'lucide-react';

/** Auth layout: centered card on the brand gradient wash (style.md §2.5). */
export function AuthLayout() {
  return (
    <div className="relative grid min-h-screen place-items-center bg-gradient-to-b from-slate-50 via-canvas to-slate-100/60 px-4 py-12">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="grid size-12 place-items-center rounded-card bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md ring-4 ring-brand-500/10">
            <Truck className="size-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-ink-primary">
              Fleet Management System
            </h1>
            <p className="mt-1 text-[13px] text-ink-secondary">
              Delivery operations for small &amp; medium enterprises
            </p>
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
}


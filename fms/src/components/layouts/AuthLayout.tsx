import { Outlet } from 'react-router-dom';
import { Truck } from 'lucide-react';

/** Auth layout: centered card on the brand gradient wash (style.md §2.5). */
export function AuthLayout() {
  return (
    <div className="bg-brand-wash grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-[420px]">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="grid size-12 place-items-center rounded-card bg-brand-600 text-white shadow-md">
            <Truck className="size-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-ink-primary">
              Fleet Management System
            </h1>
            <p className="mt-0.5 text-[13px] text-ink-secondary">
              Delivery operations for small &amp; medium enterprises
            </p>
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
}

import { Skeleton } from '@/components/ui/Skeleton';

/**
 * Suspense fallback for lazily-loaded routes.
 * Mirrors the shape of a typical page so the layout does not jump when content arrives
 * (style.md §7.2 — skeletons match the final geometry).
 */
export function RouteFallback() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-6">
      <span className="sr-only">Loading page…</span>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Skeleton className="h-7 w-56" />
          <Skeleton className="mt-2.5 h-4 w-80 max-w-full" />
        </div>
        <div className="flex gap-2.5">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-card border border-hairline bg-surface p-4 shadow-card">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-2.5 h-7 w-12" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-72 w-full lg:col-span-2" />
        <Skeleton className="h-72 w-full" />
      </div>
    </div>
  );
}

/** Fallback for full-screen routes (auth, public tracking, driver app). */
export function RouteFallbackPlain() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-4">
      <span className="sr-only">Loading…</span>
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

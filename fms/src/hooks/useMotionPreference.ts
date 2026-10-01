import { useEffect, useState } from 'react';

/**
 * prefers-reduced-motion, read directly via matchMedia.
 *
 * Deliberately does not use framer-motion's hook: the chart modules would then pull the
 * animation library into the Dashboard chunk for a single boolean (NFR7). The global CSS
 * block in index.css already neutralises CSS animations; this covers JS-driven ones.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  );

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

/**
 * True only during the first mount window.
 *
 * Recharts animates whenever `isAnimationActive` is true — including on every data
 * change. Feeding it this value means charts draw in once on mount and never re-animate
 * when a filter or refetch swaps the data (style.md §7.2).
 */
export function useMountAnimation(durationMs = 900): boolean {
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState(!reduced);

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setActive(false), durationMs);
    return () => clearTimeout(timer);
  }, [active, durationMs]);

  return active;
}

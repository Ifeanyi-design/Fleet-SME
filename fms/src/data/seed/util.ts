/**
 * Seed helpers. Dates are generated relative to "today" at module load so the demo
 * data always looks current (licence expiry, service-due alerts, delivery trend).
 *
 * NOTE: this whole `data/seed` layer is the swap point for real interview data
 * (PRD §3.3.1) — replace these modules with data captured from a live operator and
 * nothing else in the app needs to change.
 */

export const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

/** ISO date (YYYY-MM-DD) offset from today by `days` (negative = past). */
export function isoDate(days: number): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** ISO datetime offset from today by `days`, at `hour`. */
export function isoDateTime(days: number, hour = 9, minute = 0): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/**
 * Deterministic PRNG (mulberry32). Keeps generated seed data stable across reloads
 * so the dashboard doesn't reshuffle on every refresh.
 */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return function rng(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick a random element (safe under `noUncheckedIndexedAccess`). */
export function pick<T>(arr: readonly T[], rng: () => number): T {
  const item = arr[Math.floor(rng() * arr.length)];
  if (item === undefined) throw new Error('pick() called on an empty array.');
  return item;
}

/** Integer in [min, max]. */
export function randInt(min: number, max: number, rng: () => number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

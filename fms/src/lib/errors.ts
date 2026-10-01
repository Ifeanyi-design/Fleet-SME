import { ApiError } from '@/lib/apiClient';

/** Extract a user-facing message from an unknown thrown value. */
export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

/** True when the failure is a dispatch resource conflict (PRD TC03). */
export function isConflict(err: unknown): boolean {
  return (
    err instanceof ApiError &&
    (err.code === 'VEHICLE_UNAVAILABLE' ||
      err.code === 'DRIVER_UNAVAILABLE' ||
      err.code === 'INVALID_STATE')
  );
}

import { useEffect, useRef } from 'react';
import type { NotificationSeverity } from '@/types/domain';
import { useNotificationWatcher } from '@/hooks/useNotifications';
import { useToast, type ToastVariant } from '@/components/ui/Toast';

/**
 * Raises a toast when a new notification arrives while the user is in the app (FR9).
 *
 * Renders nothing — it exists purely for the side effect. The first load primes the
 * high-water mark instead of firing, so opening the app never spams the backlog.
 */

const SEVERITY_TO_TOAST: Record<NotificationSeverity, ToastVariant> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error',
};

export function NotificationWatcher() {
  const { toast } = useToast();
  const { data } = useNotificationWatcher();
  const lastSeenIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!data) return;

    const highestId = data.reduce((max, item) => Math.max(max, item.notificationId), 0);

    // First successful load: remember where we are, don't announce history.
    if (lastSeenIdRef.current === null) {
      lastSeenIdRef.current = highestId;
      return;
    }

    const fresh = data.filter((item) => item.notificationId > (lastSeenIdRef.current ?? 0));
    lastSeenIdRef.current = highestId;

    // Cap at 3 so a burst never buries the screen.
    for (const item of fresh.slice(0, 3)) {
      toast({
        variant: SEVERITY_TO_TOAST[item.severity],
        title: item.title,
        description: item.body,
        duration: 6000,
      });
    }
  }, [data, toast]);

  return null;
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { NotificationFilters } from '@/types/domain';

/**
 * Notifications (FR9).
 *
 * The summary polls so the bell badge stays current and the app can raise a toast when
 * something new arrives. The list does NOT poll — it is refetched when the panel or the
 * notifications page opens, which keeps the payload off the critical path.
 */

const SUMMARY_POLL_MS = 15_000;

export function useNotificationSummary(poll = false) {
  return useQuery({
    queryKey: queryKeys.notificationSummary(),
    queryFn: () => api.getNotificationSummary(),
    refetchInterval: poll ? SUMMARY_POLL_MS : false,
    refetchIntervalInBackground: false,
  });
}

export function useNotifications(filters: NotificationFilters = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.notifications(filters),
    queryFn: () => api.listNotifications(filters),
    enabled,
  });
}

/**
 * Polls the unread list so the app can raise a toast the moment something new arrives
 * while the user is working. Slower than the badge poll — toasts are a courtesy, not a
 * live feed.
 */
export function useNotificationWatcher() {
  return useQuery({
    queryKey: queryKeys.notifications({ unreadOnly: true, limit: 10 }),
    queryFn: () => api.listNotifications({ unreadOnly: true, limit: 10 }),
    refetchInterval: 20_000,
    refetchIntervalInBackground: false,
  });
}

/** Invalidate every notification query (list variants + summary). */
function invalidateNotifications(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['notifications'] });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: number) => api.markNotificationRead(notificationId),
    onSuccess: () => invalidateNotifications(queryClient),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: () => invalidateNotifications(queryClient),
  });
}

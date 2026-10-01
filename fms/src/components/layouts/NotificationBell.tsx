import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { AppNotification } from '@/types/domain';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationSummary,
  useNotifications,
} from '@/hooks/useNotifications';
import { Badge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/IconButton';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import {
  CATEGORY_ICON,
  CATEGORY_LABEL,
  SEVERITY_CHIP,
  SEVERITY_VARIANT,
  relativeTime,
} from '@/components/modules/notifications/notificationStyles';

/**
 * Notification bell (FR9).
 *
 * Opening the panel deliberately does NOT mark anything read — only clicking an item
 * (which opens what it refers to) or pressing "Mark all read" does. Nothing is ever
 * removed, so read notifications stay available on the notifications page.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // The badge polls; the list is fetched only while the panel is open.
  const summaryQuery = useNotificationSummary(true);
  const listQuery = useNotifications({ limit: 6 }, open);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const unread = summaryQuery.data?.unread ?? 0;
  const items = listQuery.data ?? [];

  function openItem(notification: AppNotification) {
    setOpen(false);
    if (!notification.isRead) markRead.mutate(notification.notificationId);
    if (notification.link) navigate(notification.link);
  }

  function handleMarkAll() {
    markAll.mutate(undefined, {
      onSuccess: (result) =>
        toast({
          variant: 'success',
          title: `${result.marked} marked as read`,
          description: 'Nothing is deleted — they stay on your notifications page.',
        }),
    });
  }

  return (
    <div className="relative" ref={containerRef}>
      <IconButton
        label={unread > 0 ? `Notifications (${unread} unread)` : 'Notifications'}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="relative"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[1rem] place-items-center rounded-full bg-state-error px-1 text-[10px] font-semibold leading-none text-white"
            aria-hidden
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </IconButton>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className={cn(
            // Mobile: pinned to the viewport with equal margins, so it can never overhang
            // the left edge. The bell is NOT the rightmost item in the topbar (the avatar
            // menu sits to its right), so anchoring to the bell with a near-full-width
            // panel pushed it ~36px off-screen on every common phone width.
            'fixed inset-x-4 top-[4.5rem] z-40',
            // Tablet and up: revert to a fixed-width panel anchored under the bell.
            'sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96',
            'overflow-hidden rounded-panel border border-hairline bg-surface shadow-pop',
          )}
        >
          <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-semibold text-ink-primary">Notifications</p>
              {unread > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-red-700">
                  {unread} unread
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                disabled={markAll.isPending}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-brand-700 transition-colors hover:text-brand-800 disabled:opacity-50"
              >
                <CheckCheck className="size-3.5" aria-hidden />
                Mark all read
              </button>
            )}
          </div>

          {listQuery.isLoading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-9 text-center">
              <span className="mb-3 grid size-11 place-items-center rounded-full bg-brand-100 text-brand-700">
                <CheckCircle2 className="size-5" aria-hidden />
              </span>
              <p className="text-sm font-semibold text-ink-primary">No notifications</p>
              <p className="mt-1 text-[13px] text-ink-secondary">
                Dispatch, maintenance and compliance events will appear here.
              </p>
            </div>
          ) : (
            <ul className="max-h-[min(24rem,calc(100dvh-16rem))] overflow-y-auto p-1.5">
              {items.map((notification) => {
                const Icon = CATEGORY_ICON[notification.category];
                return (
                  <li key={notification.notificationId}>
                    <button
                      type="button"
                      onClick={() => openItem(notification)}
                      className={cn(
                        'flex w-full items-start gap-3 rounded-control px-2.5 py-2.5 text-left transition-colors duration-150 hover:bg-surface-hover',
                        !notification.isRead && 'bg-blue-50/40',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 grid size-8 shrink-0 place-items-center rounded-chip',
                          SEVERITY_CHIP[notification.severity],
                        )}
                        aria-hidden
                      >
                        <Icon className="size-4" />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          {!notification.isRead && (
                            <span
                              className="size-1.5 shrink-0 rounded-full bg-state-info"
                              aria-label="Unread"
                            />
                          )}
                          <span
                            className={cn(
                              'truncate text-[13px]',
                              notification.isRead
                                ? 'font-medium text-ink-body'
                                : 'font-semibold text-ink-primary',
                            )}
                          >
                            {notification.title}
                          </span>
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-ink-secondary">
                          {notification.body}
                        </span>
                        <span className="mt-1 flex items-center gap-2">
                          <Badge variant={SEVERITY_VARIANT[notification.severity]}>
                            {CATEGORY_LABEL[notification.category]}
                          </Badge>
                          <span className="text-[11px] tabular-nums text-ink-muted">
                            {relativeTime(notification.createdAt)}
                          </span>
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate('/notifications');
            }}
            className="w-full border-t border-hairline px-4 py-3 text-[13px] font-medium text-brand-700 transition-colors hover:bg-surface-hover"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}

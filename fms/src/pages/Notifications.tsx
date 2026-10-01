import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellOff, CheckCheck, ChevronRight, Inbox } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { AppNotification, NotificationCategory } from '@/types/domain';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationSummary,
  useNotifications,
} from '@/hooks/useNotifications';
import { PageHeader } from '@/components/layouts/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { FilterChips, type FilterOption } from '@/components/modules/shared/FilterBar';
import {
  CATEGORY_ICON,
  CATEGORY_LABEL,
  SEVERITY_CHIP,
  SEVERITY_VARIANT,
  relativeTime,
} from '@/components/modules/notifications/notificationStyles';

/**
 * All notifications (FR9).
 *
 * Everything ever raised lives here, read or unread. Read items are kept — marking read
 * only clears the unread flag, it never deletes.
 */

type CategoryFilter = NotificationCategory | 'all';

const BASE_OPTIONS: FilterOption<CategoryFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'dispatch', label: 'Dispatch' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'fleet', label: 'Fleet' },
];

export function Notifications() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [category, setCategory] = useState<CategoryFilter>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);

  const summaryQuery = useNotificationSummary();
  const query = useNotifications({ category, unreadOnly, limit: 120 });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const items = query.data ?? [];
  const summary = summaryQuery.data;
  const unreadByCategory = summary?.unreadByCategory;

  const options = BASE_OPTIONS.map((option) => ({
    ...option,
    count:
      option.value === 'all'
        ? summary?.unread
        : unreadByCategory?.[option.value as NotificationCategory],
  }));

  function openItem(notification: AppNotification) {
    if (!notification.isRead) markRead.mutate(notification.notificationId);
    if (notification.link) navigate(notification.link);
  }

  function handleMarkAll() {
    markAll.mutate(undefined, {
      onSuccess: (result) =>
        toast({
          variant: 'success',
          title: `${result.marked} marked as read`,
          description: 'Nothing was deleted — read notifications stay in this list.',
        }),
    });
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Dispatch, maintenance, compliance and fleet events. Read items are kept."
        breadcrumbs={[{ label: 'Account' }, { label: 'Notifications' }]}
        actions={
          <>
            {(summary?.unread ?? 0) > 0 && (
              <Button
                variant="secondary"
                leftIcon={<CheckCheck className="size-4" />}
                onClick={handleMarkAll}
                loading={markAll.isPending}
              >
                Mark all read
              </Button>
            )}
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterChips options={options} value={category} onChange={setCategory} />
        <button
          type="button"
          aria-pressed={unreadOnly}
          onClick={() => setUnreadOnly((v) => !v)}
          className={cn(
            'inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors duration-150',
            unreadOnly
              ? 'bg-ink-primary text-white'
              : 'border border-hairline-strong bg-white text-ink-secondary hover:bg-surface-hover hover:text-ink-primary',
          )}
        >
          <BellOff className="size-3.5" aria-hidden />
          Unread only
        </button>
      </div>

      {query.isError ? (
        <ErrorState title="Could not load notifications" onRetry={() => void query.refetch()} />
      ) : query.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card flush>
          <EmptyState
            icon={<Inbox className="size-6" />}
            title={unreadOnly ? 'Nothing unread' : 'No notifications yet'}
            description={
              unreadOnly
                ? 'You have read everything in this category.'
                : 'Operational events will appear here as they happen.'
            }
          />
        </Card>
      ) : (
        <Card flush className="divide-y divide-[#F1F2F4] overflow-hidden">
          {items.map((notification) => {
            const Icon = CATEGORY_ICON[notification.category];
            return (
              <button
                key={notification.notificationId}
                type="button"
                onClick={() => openItem(notification)}
                className={cn(
                  'flex w-full items-start gap-3.5 px-4 py-4 text-left transition-colors duration-150 hover:bg-surface-hover',
                  !notification.isRead && 'bg-blue-50/40',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 grid size-9 shrink-0 place-items-center rounded-chip',
                    SEVERITY_CHIP[notification.severity],
                  )}
                  aria-hidden
                >
                  <Icon className="size-4" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    {!notification.isRead && (
                      <span
                        className="size-1.5 shrink-0 rounded-full bg-state-info"
                        aria-label="Unread"
                      />
                    )}
                    <span
                      className={cn(
                        'text-sm',
                        notification.isRead
                          ? 'font-medium text-ink-body'
                          : 'font-semibold text-ink-primary',
                      )}
                    >
                      {notification.title}
                    </span>
                    <Badge variant={SEVERITY_VARIANT[notification.severity]}>
                      {CATEGORY_LABEL[notification.category]}
                    </Badge>
                    {notification.isRead && <Badge variant="neutral">Read</Badge>}
                  </span>

                  {notification.body && (
                    <span className="mt-1 block text-[13px] text-ink-secondary">
                      {notification.body}
                    </span>
                  )}

                  <span className="mt-1.5 block text-[11px] tabular-nums text-ink-muted">
                    {relativeTime(notification.createdAt)}
                  </span>
                </span>

                {notification.link && (
                  <ChevronRight className="mt-1 size-4 shrink-0 text-ink-muted" aria-hidden />
                )}
              </button>
            );
          })}
        </Card>
      )}
    </>
  );
}

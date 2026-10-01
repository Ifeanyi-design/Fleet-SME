import { useMemo, useState, type ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/Skeleton';
import { Table, TableContainer, TBody, TD, TH, THead, TR } from '@/components/ui/Table';

/**
 * Generic, column-driven data table.
 *
 * Responsive contract (style.md §4.3 / plan.md §4.3): a real <table> on md+ and a
 * stacked card list below md — data tables never scroll horizontally on mobile.
 * The first column becomes the card heading in the mobile view.
 */
export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  align?: 'left' | 'right';
  /** Hide below md in the table view. */
  hideOnMobile?: boolean;
  /** Override the label used in the mobile card view. */
  mobileLabel?: string;
  headerClassName?: string;
  cellClassName?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyOf: (row: T) => string | number;
  loading?: boolean;
  skeletonRows?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  onRowClick?: (row: T) => void;
  /** Rendered as the final table column and in the mobile card footer. */
  rowActions?: (row: T) => ReactNode;
  /** Client-side pagination — omit to render every row. */
  pageSize?: number;
  /** Accessible name for the table element. */
  ariaLabel?: string;
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  keyOf,
  loading = false,
  skeletonRows = 6,
  emptyTitle = 'Nothing to show',
  emptyDescription,
  emptyAction,
  onRowClick,
  rowActions,
  pageSize,
  ariaLabel,
  className,
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);

  const pageCount = pageSize ? Math.max(1, Math.ceil(rows.length / pageSize)) : 1;
  const safePage = Math.min(page, pageCount);

  const visibleRows = useMemo(() => {
    if (!pageSize) return rows;
    const start = (safePage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, pageSize, safePage]);

  const [primary, ...secondary] = columns;
  const showEmpty = !loading && rows.length === 0;

  /* ── empty state ─────────────────────────────────────────────────────── */
  if (showEmpty) {
    return (
      <Card flush className={className}>
        <EmptyState
          icon={<Inbox className="size-6" />}
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      </Card>
    );
  }

  return (
    <div className={className} aria-busy={loading || undefined}>
      {loading && (
        <span role="status" aria-live="polite" className="sr-only">
          Loading data…
        </span>
      )}

      {/* ── table view (md+) ──────────────────────────────────────────── */}
      <TableContainer className="hidden md:block">
        <div className="overflow-x-auto">
          <Table aria-label={ariaLabel}>
            <THead>
              <tr>
                {columns.map((col) => (
                  <TH
                    key={col.key}
                    className={cn(
                      col.align === 'right' && 'text-right',
                      col.hideOnMobile && 'hidden lg:table-cell',
                      col.headerClassName,
                    )}
                  >
                    {col.header}
                  </TH>
                ))}
                {rowActions && <TH className="w-px text-right">Actions</TH>}
              </tr>
            </THead>
            <TBody>
              {loading
                ? Array.from({ length: skeletonRows }).map((_, i) => (
                    <TR key={`skeleton-${i}`} className="hover:bg-transparent">
                      {columns.map((col) => (
                        <TD key={col.key}>
                          <Skeleton className="h-4 w-24" />
                        </TD>
                      ))}
                      {rowActions && (
                        <TD>
                          <Skeleton className="ml-auto h-4 w-12" />
                        </TD>
                      )}
                    </TR>
                  ))
                : visibleRows.map((row) => (
                    <TR
                      key={keyOf(row)}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      className={onRowClick ? 'cursor-pointer' : undefined}
                    >
                      {columns.map((col) => (
                        <TD
                          key={col.key}
                          className={cn(
                            col.align === 'right' && 'text-right',
                            col.hideOnMobile && 'hidden lg:table-cell',
                            col.cellClassName,
                          )}
                        >
                          {col.cell(row)}
                        </TD>
                      ))}
                      {rowActions && (
                        <TD className="w-px whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1">
                            {rowActions(row)}
                          </div>
                        </TD>
                      )}
                    </TR>
                  ))}
            </TBody>
          </Table>
        </div>
        {pageSize && !loading && (
          <Pagination
            page={safePage}
            pageCount={pageCount}
            onPageChange={setPage}
            total={rows.length}
            pageSize={pageSize}
          />
        )}
      </TableContainer>

      {/* ── card view (< md) ──────────────────────────────────────────── */}
      <div className="space-y-3 md:hidden">
        {loading
          ? Array.from({ length: Math.min(skeletonRows, 4) }).map((_, i) => (
              <Card key={`skeleton-card-${i}`}>
                <Skeleton className="h-5 w-32" />
                <div className="mt-4 space-y-2.5">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </Card>
            ))
          : visibleRows.map((row) => (
              <Card
                key={keyOf(row)}
                interactive={Boolean(onRowClick)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {primary && (
                  <div className="flex items-start justify-between gap-3 border-b border-hairline pb-3">
                    <div className="min-w-0 text-sm font-semibold text-ink-primary">
                      {primary.cell(row)}
                    </div>
                  </div>
                )}
                <dl className="mt-3 space-y-2">
                  {secondary
                    .filter((col) => !col.hideOnMobile)
                    .map((col) => (
                      <div key={col.key} className="flex items-center justify-between gap-3">
                        <dt className="text-[13px] text-ink-secondary">
                          {col.mobileLabel ?? col.header}
                        </dt>
                        <dd className="text-right text-[13px] font-medium text-ink-primary">
                          {col.cell(row)}
                        </dd>
                      </div>
                    ))}
                </dl>
                {rowActions && (
                  <div className="mt-4 flex items-center justify-end gap-2 border-t border-hairline pt-3">
                    {rowActions(row)}
                  </div>
                )}
              </Card>
            ))}
        {pageSize && !loading && rows.length > pageSize && (
          <div className="rounded-card border border-hairline bg-surface px-4">
            <Pagination
              page={safePage}
              pageCount={pageCount}
              onPageChange={setPage}
              total={rows.length}
              pageSize={pageSize}
              className="border-t-0"
            />
          </div>
        )}
      </div>
    </div>
  );
}

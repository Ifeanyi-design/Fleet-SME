import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconButton } from '@/components/ui/IconButton';

export interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /** Total row count, shown as "Showing 1–20 of 128". */
  total?: number;
  pageSize?: number;
  className?: string;
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  total,
  pageSize,
  className,
}: PaginationProps) {
  if (pageCount <= 1) return null;

  const from = total !== undefined && pageSize ? (page - 1) * pageSize + 1 : undefined;
  const to = total !== undefined && pageSize ? Math.min(page * pageSize, total) : undefined;

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-t border-hairline px-4 py-3',
        className,
      )}
    >
      <p className="text-xs text-ink-secondary">
        {from !== undefined && to !== undefined && total !== undefined
          ? `Showing ${from}–${to} of ${total}`
          : `Page ${page} of ${pageCount}`}
      </p>
      <div className="flex items-center gap-1.5">
        <IconButton
          label="Previous page"
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-4" />
        </IconButton>
        <span className="min-w-[3rem] text-center text-xs font-medium tabular-nums text-ink-body">
          {page} / {pageCount}
        </span>
        <IconButton
          label="Next page"
          size="sm"
          variant="outline"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="size-4" />
        </IconButton>
      </div>
    </div>
  );
}

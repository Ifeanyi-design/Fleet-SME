import type { ReactNode } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Input } from '@/components/ui/Input';
import { IconButton } from '@/components/ui/IconButton';

/** Filter chip — active state is a solid dark pill (style.md §7.2). */
export interface FilterOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

export interface FilterChipsProps<T extends string> {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  className,
}: FilterChipsProps<T>) {
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)} role="group">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-medium tracking-tight',
              'transition-all duration-150 ease-out',
              active
                ? 'bg-ink-primary text-white shadow-xs'
                : 'border border-hairline-strong/80 bg-white text-ink-secondary hover:border-hairline-hover hover:bg-surface-hover hover:text-ink-primary shadow-[0_1px_2px_rgba(15,23,42,0.02)]',
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 text-[10px] font-semibold tabular-nums',
                  active ? 'bg-white/20 text-white' : 'bg-slate-100 text-ink-muted',
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** Chips or other controls rendered on the right. */
  children?: ReactNode;
  className?: string;
}

/** Search + filter controls that sit above a DataTable. */
export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  children,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        'mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between',
        className,
      )}
    >
      <div className="w-full lg:max-w-xs">
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          leftIcon={<Search className="size-4" />}
          rightSlot={
            search ? (
              <IconButton label="Clear search" onClick={() => onSearchChange('')}>
                <X className="size-4" />
              </IconButton>
            ) : undefined
          }
          aria-label={searchPlaceholder}
        />
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

